import crypto from 'node:crypto';
import { supabase } from '../config/supabaseClient.js';
import { projectModel, getImageUrl } from '../models/projectModel.js';
import { projectItemModel } from '../models/projectItemModel.js';
import { projectPhotoModel } from '../models/projectPhotoModel.js';
import { detectImageFormatFromBuffer } from '../middlewares/upload.js';

const ALLOWED_STATUS = new Set(['planned', 'in_progress', 'done']);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseIntStrict(val) {
  if (typeof val !== 'number' && typeof val !== 'string') return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  return Number.isInteger(num) ? num : null;
}

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

export const projectController = {
  // Middleware pra-cek: Validasi format UUID dan pastikan proyek ada di DB sebelum upload file
  async checkProjectExistsBeforeUpload(req, res, next) {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'Format UUID proyek tidak valid.' });
    }

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, name, description, status, image_path, created_at')
        .eq('id', id)
        .single();

      if (error || !project) {
        return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
      }

      req.targetProject = project;
      return next();
    } catch (err) {
      return next(err);
    }
  },

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

      // Ambil foto dokumentasi via query terpisah agar kegagalan/ketiadaan tabel foto tidak mematikan detail proyek
      let photos = [];
      try {
        photos = await projectPhotoModel.getByProjectId(req.params.id);
      } catch (photoErr) {
        console.warn('[PROJECT_PHOTOS_WARN] Gagal mengambil foto proyek:', photoErr?.message || photoErr);
        photos = [];
      }

      return res.status(200).json({ data: { ...rest, items, summary, photos } });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) {
      return res.status(400).json({ error: 'Nama proyek wajib diisi (maksimal 120 karakter).' });
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
      return res.status(400).json({ error: 'Deskripsi proyek harus berupa teks.' });
    }

    let status = 'planned';
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !ALLOWED_STATUS.has(body.status.trim())) {
        return res.status(400).json({ error: "Status proyek tidak valid. Pilihan: 'planned', 'in_progress', 'done'." });
      }
      status = body.status.trim();
    }

    const payload = {
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      status,
    };

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const validatedItems = [];
    const seenCompIds = new Set();

    for (const item of rawItems) {
      const compId = typeof item?.component_id === 'string' ? item.component_id.trim() : '';
      if (!compId) {
        return res.status(400).json({ error: 'Setiap item BOM wajib menyertakan component_id.' });
      }
      if (seenCompIds.has(compId)) {
        return res.status(409).json({ error: 'Terdapat komponen duplikat di dalam daftar BOM.' });
      }
      seenCompIds.add(compId);

      const qty = parseIntStrict(item.quantity_needed);
      if (qty === null || qty <= 0) {
        return res.status(400).json({ error: 'Jumlah kebutuhan komponen pada BOM wajib bilangan bulat > 0.' });
      }
      validatedItems.push({ component_id: compId, quantity_needed: qty });
    }

    let createdProject = null;
    try {
      createdProject = await projectModel.create(payload);

      if (validatedItems.length > 0) {
        const rows = validatedItems.map((it) => ({
          project_id: createdProject.id,
          component_id: it.component_id,
          quantity_needed: it.quantity_needed,
        }));

        const { error: itemsError } = await supabase.from('project_items').insert(rows);
        if (itemsError) {
          // Compensating delete bila insert BOM gagal
          try {
            await supabase.from('projects').delete().eq('id', createdProject.id);
          } catch (compErr) {
            console.error('[CRITICAL] Gagal compensating delete proyek yatim ID:', createdProject.id, compErr);
          }
          throw itemsError;
        }
      }

      const fullProject = await projectModel.getById(createdProject.id);
      const { items, summary } = calculateBomAnalytics(fullProject.project_items || []);

      return res.status(201).json({
        message: 'Proyek berhasil dibuat.',
        data: {
          ...fullProject,
          items,
          summary,
        },
      });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 120) {
      return res.status(400).json({ error: 'Nama proyek wajib diisi (maksimal 120 karakter).' });
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
      return res.status(400).json({ error: 'Deskripsi proyek harus berupa teks.' });
    }

    // Eksklusif HANYA name dan description: status dan image_path TIDAK PERNAH diubah via PUT
    const payload = {
      name,
      description: typeof body.description === 'string' ? body.description.trim() : '',
    };

    try {
      const updated = await projectModel.update(req.params.id, payload);
      return res.status(200).json({ message: 'Data proyek berhasil diperbarui.', data: updated });
    } catch (err) {
      return next(err);
    }
  },

  async updateStatus(req, res, next) {
    if (!UUID_REGEX.test(req.params.id)) {
      return res.status(400).json({ error: 'Format UUID proyek tidak valid.' });
    }

    const body = req.body ?? {};
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    if (!ALLOWED_STATUS.has(status)) {
      return res.status(400).json({
        error: "Status proyek tidak valid. Pilihan: 'planned', 'in_progress', 'done'.",
      });
    }

    try {
      const updated = await projectModel.updateStatus(req.params.id, status);
      return res.status(200).json({
        message: 'Status proyek berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  },

  async uploadImage(req, res, next) {
    if (!req.file) {
      return res.status(400).json({ error: 'Berkas gambar wajib diunggah pada field image.' });
    }

    if (req.file.size === 0 || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Berkas gambar tidak boleh kosong (0 byte).' });
    }

    // Deteksi ekstensi dan MIME asli secara independen HANYA dari magic bytes biner
    const detected = detectImageFormatFromBuffer(req.file.buffer);
    if (!detected) {
      return res.status(400).json({
        error: 'Konten berkas bukan gambar JPEG, PNG, atau WebP yang valid (magic bytes tidak cocok).',
      });
    }

    try {
      const project = req.targetProject || (await projectModel.getById(req.params.id));
      const newFileName = `projects/${project.id}/${crypto.randomUUID()}.${detected.ext}`;

      // 1. Unggah berkas baru ke Supabase Storage bucket 'project-images'
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(newFileName, req.file.buffer, {
          contentType: detected.mime,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Perbarui kolom image_path di database
      let updatedProject;
      try {
        updatedProject = await projectModel.updateImagePath(project.id, newFileName);
      } catch (dbError) {
        // Rollback: hapus berkas baru jika update DB gagal
        await supabase.storage
          .from('project-images')
          .remove([newFileName])
          .catch((cleanErr) => console.warn('[STORAGE_ROLLBACK_WARN]', cleanErr));
        throw dbError;
      }

      // 3. Best-effort hapus berkas gambar lama di Storage jika berbeda
      const oldPath = project.image_path;
      if (oldPath && oldPath !== newFileName) {
        supabase.storage
          .from('project-images')
          .remove([oldPath])
          .catch((err) => console.warn('[STORAGE_OLD_DELETE_WARN]', err));
      }

      return res.status(200).json({
        message: 'Foto proyek berhasil diunggah.',
        data: updatedProject,
      });
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

  // Endpoint #17: Unggah foto dokumentasi proyek baru (multipart/form-data)
  async addPhoto(req, res, next) {
    if (!req.file) {
      return res.status(400).json({ error: 'Berkas gambar wajib diunggah pada field image.' });
    }

    if (req.file.size === 0 || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Berkas gambar tidak boleh kosong (0 byte).' });
    }

    const detected = detectImageFormatFromBuffer(req.file.buffer);
    if (!detected) {
      return res.status(400).json({
        error: 'Konten berkas bukan gambar JPEG, PNG, atau WebP yang valid (magic bytes tidak cocok).',
      });
    }

    const body = req.body ?? {};
    if (body.caption !== undefined && typeof body.caption !== 'string') {
      return res.status(400).json({ error: 'Caption foto harus berupa teks.' });
    }
    const caption = typeof body.caption === 'string' ? body.caption.trim() : '';
    if (caption.length > 200) {
      return res.status(400).json({ error: 'Panjang caption maksimal 200 karakter.' });
    }

    try {
      // 1. Verifikasi keberadaan proyek di database
      const { data: project, error: projError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', req.params.id)
        .single();

      if (projError || !project) {
        return res.status(404).json({ error: 'Proyek tidak ditemukan.' });
      }

      // Verifikasi batas maksimal 12 foto per proyek
      const photoCount = await projectPhotoModel.countByProjectId(req.params.id);
      if (photoCount >= 12) {
        return res.status(400).json({ error: 'Jumlah foto telah mencapai batas maksimal 12 foto per proyek.' });
      }

      // 2. Unggah berkas ke Supabase Storage bucket 'project-images'
      const newFileName = `projects/${project.id}/docs/${crypto.randomUUID()}.${detected.ext}`;
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(newFileName, req.file.buffer, {
          contentType: detected.mime,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 3. Simpan record metadata ke database dengan compensating rollback jika insert gagal
      let createdPhoto;
      try {
        createdPhoto = await projectPhotoModel.create({
          project_id: project.id,
          image_path: newFileName,
          caption,
        });
      } catch (dbError) {
        await supabase.storage
          .from('project-images')
          .remove([newFileName])
          .catch((cleanErr) => console.warn('[STORAGE_ROLLBACK_WARN] Gagal rollback foto docs:', cleanErr));
        throw dbError;
      }

      return res.status(201).json({
        message: 'Foto dokumentasi proyek berhasil ditambahkan.',
        data: createdPhoto,
      });
    } catch (err) {
      return next(err);
    }
  },

  // Endpoint #18: Perbarui teks caption foto dokumentasi
  async updatePhotoCaption(req, res, next) {
    const body = req.body ?? {};
    if (body.caption === undefined || typeof body.caption !== 'string') {
      return res.status(400).json({ error: 'Caption foto wajib berupa teks.' });
    }

    const caption = body.caption.trim();
    if (caption.length > 200) {
      return res.status(400).json({ error: 'Panjang caption maksimal 200 karakter.' });
    }

    try {
      const updated = await projectPhotoModel.updateCaption(req.params.id, req.params.photoId, caption);
      if (!updated) {
        return res.status(404).json({ error: 'Foto tidak ditemukan pada proyek ini.' });
      }

      return res.status(200).json({
        message: 'Caption foto dokumentasi berhasil diperbarui.',
        data: updated,
      });
    } catch (err) {
      return next(err);
    }
  },

  // Endpoint #19: Hapus foto dokumentasi proyek beserta berkas di Storage
  async removePhoto(req, res, next) {
    try {
      const deleted = await projectPhotoModel.remove(req.params.id, req.params.photoId);
      if (!deleted) {
        return res.status(404).json({ error: 'Foto tidak ditemukan pada proyek ini.' });
      }

      return res.status(200).json({
        message: 'Foto dokumentasi berhasil dihapus.',
        data: deleted,
      });
    } catch (err) {
      return next(err);
    }
  },
};
