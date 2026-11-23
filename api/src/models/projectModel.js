import { supabase } from '../config/supabaseClient.js';
import { projectPhotoModel } from './projectPhotoModel.js';

const PROJECT_WITH_BOM_SELECT = `
  *,
  project_items (
    id,
    component_id,
    quantity_needed,
    components (
      id,
      name,
      category,
      stock,
      min_stock,
      unit_price,
      bin_location
    )
  )
`;

function createNotFoundError(message) {
  const err = new Error(message);
  err.code = 'PGRST116';
  return err;
}

export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  const { data } = supabase.storage.from('project-images').getPublicUrl(imagePath);
  return data?.publicUrl || null;
}

export const projectModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_WITH_BOM_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((proj) => ({
      ...proj,
      image_url: getImageUrl(proj.image_path),
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_WITH_BOM_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  async updateImagePath(id, imagePath) {
    const { data, error } = await supabase
      .from('projects')
      .update({ image_path: imagePath })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  async remove(id) {
    // Kumpulkan path semua berkas foto dokumentasi proyek sebelum record proyek terhapus cascade
    let photoPaths = [];
    try {
      photoPaths = await projectPhotoModel.getAllImagePaths(id);
    } catch (photoErr) {
      console.warn('[STORAGE_DELETE_WARN] Gagal membaca list foto sebelum proyek dihapus:', photoErr);
    }

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw createNotFoundError('Proyek tidak ditemukan.');
    }
    const deleted = data[0];

    // Best-effort hapus berkas gambar lama di storage jika ada
    if (deleted.image_path) {
      supabase.storage
        .from('project-images')
        .remove([deleted.image_path])
        .catch((err) => {
          console.warn('[STORAGE_DELETE_WARN] Gagal menghapus berkas di storage:', deleted.image_path, err);
        });
    }

    // Best-effort hapus seluruh berkas foto dokumentasi proyek di storage jika ada
    if (photoPaths.length > 0) {
      supabase.storage
        .from('project-images')
        .remove(photoPaths)
        .catch((err) => {
          console.warn('[STORAGE_DELETE_WARN] Gagal menghapus foto dokumentasi di storage:', err);
        });
    }

    return {
      ...deleted,
      image_url: null,
    };
  },
};
