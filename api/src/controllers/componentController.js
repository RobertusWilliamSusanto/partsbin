import { componentModel } from '../models/componentModel.js';

// Kenapa tidak pakai parseInt()? Karena parseInt("12abc") lolos menjadi 12 dan parseInt(1.5) menjadi 1.
// parseIntStrict menolak boolean, string kosong, huruf, maupun angka desimal.
function parseIntStrict(val) {
  if (typeof val !== 'number' && typeof val !== 'string') return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  return Number.isInteger(num) ? num : null;
}

function formatComponent(comp) {
  const { project_items: projectItems, ...rest } = comp;
  const formatted = {
    ...rest,
    // Rumus bisnis: stok menipis jika stock <= min_stock
    is_low_stock: comp.stock <= comp.min_stock,
  };

  if (Array.isArray(projectItems)) {
    formatted.used_in_projects = projectItems
      .filter((item) => item.projects)
      .map((item) => ({
        item_id: item.id,
        project_id: item.projects.id,
        project_name: item.projects.name,
        quantity_needed: item.quantity_needed,
      }));
  }

  return formatted;
}

function validateComponentPayload(body, { requireComplete = false } = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 120) {
    return { error: 'Nama komponen wajib diisi (maksimal 120 karakter).' };
  }

  const category = typeof body.category === 'string' ? body.category.trim() : '';
  if (!category || category.length > 50) {
    return {
      error: 'Kategori wajib diisi (maksimal 50 karakter).',
    };
  }

  const binLocation =
    typeof body.bin_location === 'string' ? body.bin_location.trim() : '';
  if (!binLocation || binLocation.length > 40) {
    return { error: 'Lokasi laci (bin_location) wajib diisi (maksimal 40 karakter).' };
  }

  const stockRaw = body.stock === undefined && !requireComplete ? 0 : body.stock;
  const stock = parseIntStrict(stockRaw);
  if (stock === null || stock < 0) {
    return { error: 'Stok wajib berupa bilangan bulat >= 0.' };
  }

  const minStockRaw =
    body.min_stock === undefined && !requireComplete ? 2 : body.min_stock;
  const minStock = parseIntStrict(minStockRaw);
  if (minStock === null || minStock < 0) {
    return { error: 'Stok minimum (min_stock) wajib berupa bilangan bulat >= 0.' };
  }

  const unitPriceRaw =
    body.unit_price === undefined && !requireComplete ? 0 : body.unit_price;
  const unitPrice = parseIntStrict(unitPriceRaw);
  if (unitPrice === null || unitPrice < 0) {
    return { error: 'Harga satuan (unit_price) wajib berupa bilangan bulat >= 0.' };
  }

  if (requireComplete && typeof body.specs !== 'string') {
    return { error: 'Field spesifikasi (specs) wajib disertakan berupa teks pada operasi PUT.' };
  }
  if (body.specs !== undefined && typeof body.specs !== 'string') {
    return { error: 'Spesifikasi (specs) harus berupa teks.' };
  }

  return {
    payload: {
      name,
      category,
      stock,
      min_stock: minStock,
      unit_price: unitPrice,
      bin_location: binLocation,
      specs: typeof body.specs === 'string' ? body.specs.trim() : '',
    },
  };
}

export const componentController = {
  async getAll(_req, res, next) {
    try {
      const components = await componentModel.getAll();
      return res.status(200).json({
        data: components.map(formatComponent),
      });
    } catch (err) {
      return next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const component = await componentModel.getById(req.params.id);
      return res.status(200).json({
        data: formatComponent(component),
      });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    // Kenapa guard req.body ?? {}? Di Express 5, request tanpa body menghasilkan undefined bukan {}.
    const body = req.body ?? {};
    const { payload, error } = validateComponentPayload(body, { requireComplete: false });
    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const created = await componentModel.create(payload);
      return res.status(201).json({
        message: 'Komponen berhasil ditambahkan.',
        data: formatComponent(created),
      });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    // Guard wajib Express 5 agar tidak melempar TypeError jika client mengirim PUT tanpa body
    const body = req.body ?? {};
    const { payload, error } = validateComponentPayload(body, { requireComplete: true });
    if (error) {
      return res.status(400).json({ error });
    }

    try {
      const updated = await componentModel.update(req.params.id, payload);
      return res.status(200).json({
        message: 'Data komponen berhasil diperbarui.',
        data: formatComponent(updated),
      });
    } catch (err) {
      return next(err);
    }
  },

  async updateStock(req, res, next) {
    const body = req.body ?? {};
    const stock = parseIntStrict(body.stock);
    if (stock === null || stock < 0) {
      return res.status(400).json({
        error: 'Nilai stok wajib berupa bilangan bulat >= 0.',
      });
    }

    try {
      const updated = await componentModel.updateStock(req.params.id, stock);
      return res.status(200).json({
        message: 'Stok komponen berhasil diperbarui.',
        data: formatComponent(updated),
      });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const deleted = await componentModel.remove(req.params.id);
      return res.status(200).json({
        message: 'Komponen berhasil dihapus.',
        data: formatComponent(deleted),
      });
    } catch (err) {
      return next(err);
    }
  },
};
