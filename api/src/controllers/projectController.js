import { projectModel } from '../models/projectModel.js';
import { projectItemModel } from '../models/projectItemModel.js';

function parseIntStrict(val) {
  if (typeof val !== 'number' && typeof val !== 'string') return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  return Number.isInteger(num) ? num : null;
}

// Kalkulator BOM inti: menghitung readiness %, total biaya BOM, dan shopping_list kekurangan stok
function calculateBomAnalytics(projectItems = []) {
  const items = projectItems.map((item) => {
    const comp = item.components || {};
    const stockAvailable = comp.stock ?? 0;
    const unitPrice = comp.unit_price ?? 0;
    const shortageQty = Math.max(0, item.quantity_needed - stockAvailable);

    return {
      id: item.id,
      component_id: item.component_id,
      component_name: comp.name || '-',
      category: comp.category || '-',
      bin_location: comp.bin_location || '-',
      unit_price: unitPrice,
      stock_available: stockAvailable,
      quantity_needed: item.quantity_needed,
      shortage_qty: shortageQty,
      is_enough: shortageQty === 0,
      item_total_cost: item.quantity_needed * unitPrice,
      item_missing_cost: shortageQty * unitPrice,
    };
  });

  const totalItems = items.length;
  const readyItemsCount = items.filter((item) => item.is_enough).length;
  const readinessPercent =
    totalItems === 0 ? 0 : Math.round((readyItemsCount / totalItems) * 100);
  const totalBomCost = items.reduce((acc, item) => acc + item.item_total_cost, 0);
  const missingCost = items.reduce((acc, item) => acc + item.item_missing_cost, 0);

  const shoppingList = items
    .filter((item) => item.shortage_qty > 0)
    .map((item) => ({
      item_id: item.id,
      component_id: item.component_id,
      component_name: item.component_name,
      bin_location: item.bin_location,
      shortage_qty: item.shortage_qty,
      unit_price: item.unit_price,
      estimated_cost: item.item_missing_cost,
    }));

  return {
    items,
    summary: {
      total_items: totalItems,
      ready_items_count: readyItemsCount,
      readiness_percent: readinessPercent,
      total_bom_cost: totalBomCost,
      missing_cost: missingCost,
      shopping_list: shoppingList,
    },
  };
}

function validateProjectPayload(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) {
    return { error: 'Nama proyek wajib diisi (maksimal 120 karakter).' };
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return { error: 'Deskripsi proyek harus berupa teks.' };
  }
  return {
    payload: {
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
    },
  };
}

export const projectController = {
  async getAll(_req, res, next) {
    try {
      const projects = await projectModel.getAll();
      const formatted = projects.map(({ project_items: rawItems, ...rest }) => {
        const { summary } = calculateBomAnalytics(rawItems || []);
        return {
          ...rest,
          total_items: summary.total_items,
          ready_items_count: summary.ready_items_count,
          readiness_percent: summary.readiness_percent,
          total_bom_cost: summary.total_bom_cost,
          missing_cost: summary.missing_cost,
        };
      });
      return res.status(200).json({ data: formatted });
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { project_items: rawItems, ...rest } = await projectModel.getById(req.params.id);
      const { items, summary } = calculateBomAnalytics(rawItems || []);
      return res.status(200).json({ data: { ...rest, items, summary } });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    // Guard Express 5: req.body bisa bernilai undefined bila request dikirim tanpa body
    const body = req.body ?? {};
    const { payload, error } = validateProjectPayload(body);
    if (error) return res.status(400).json({ error });

    try {
      const created = await projectModel.create(payload);
      return res.status(201).json({
        message: 'Proyek berhasil dibuat.',
        data: {
          ...created,
          total_items: 0,
          ready_items_count: 0,
          readiness_percent: 0,
          total_bom_cost: 0,
          missing_cost: 0,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    const body = req.body ?? {};
    const { payload, error } = validateProjectPayload(body);
    if (error) return res.status(400).json({ error });

    try {
      const updated = await projectModel.update(req.params.id, payload);
      return res.status(200).json({ message: 'Data proyek berhasil diperbarui.', data: updated });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await projectModel.remove(req.params.id);
      return res.status(200).json({ message: 'Proyek berhasil dihapus.', data: deleted });
    } catch (err) {
      return next(err);
    }
  },

  async addItem(req, res, next) {
    const body = req.body ?? {};
    const componentId = typeof body.component_id === 'string' ? body.component_id.trim() : '';
    if (!componentId) {
      return res.status(400).json({ error: 'ID komponen (component_id) wajib diisi.' });
    }

    const quantityNeeded = parseIntStrict(body.quantity_needed);
    if (quantityNeeded === null || quantityNeeded <= 0) {
      return res.status(400).json({
        error: 'Jumlah kebutuhan (quantity_needed) wajib berupa bilangan bulat > 0.',
      });
    }

    try {
      const created = await projectItemModel.addItem(req.params.id, componentId, quantityNeeded);
      return res.status(201).json({
        message: 'Komponen berhasil ditambahkan ke BOM proyek.',
        data: created,
      });
    } catch (err) {
      return next(err);
    }
  },

  async removeItem(req, res, next) {
    try {
      const deleted = await projectItemModel.removeItem(req.params.id, req.params.itemId);
      return res.status(200).json({
        message: 'Item BOM berhasil dihapus dari proyek.',
        data: deleted,
      });
    } catch (err) {
      return next(err);
    }
  },
};
