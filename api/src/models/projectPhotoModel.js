import { supabase } from '../config/supabaseClient.js';
import { getImageUrl } from './projectModel.js';

export const projectPhotoModel = {
  // Ambil seluruh foto milik proyek tertentu urut berdasarkan waktu pembuatan tertua ke terbaru
  async getByProjectId(projectId) {
    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('id, project_id, image_path, caption, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Jika tabel belum ada di database atau query error, fail-safe kembalikan array kosong
      if (error) {
        console.warn('[PROJECT_PHOTOS_WARN] Gagal mengambil foto proyek:', error.message || error);
        return [];
      }

      return (data || []).map((photo) => ({
        id: photo.id,
        project_id: photo.project_id,
        image_path: photo.image_path,
        image_url: getImageUrl(photo.image_path),
        caption: photo.caption,
        created_at: photo.created_at,
      }));
    } catch (err) {
      console.warn('[PROJECT_PHOTOS_WARN] Exception saat query foto proyek:', err?.message || err);
      return [];
    }
  },

  // Hitung jumlah foto yang dimiliki suatu proyek untuk validasi batas kuota foto
  async countByProjectId(projectId) {
    const { count, error } = await supabase
      .from('project_photos')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) throw error;
    return count ?? 0;
  },

  // Simpan metadata foto baru ke database setelah berkas sukses diunggah ke Storage
  async create({ project_id, image_path, caption = '' }) {
    const { data, error } = await supabase
      .from('project_photos')
      .insert({ project_id, image_path, caption })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      image_url: getImageUrl(data.image_path),
    };
  },

  // Perbarui keterangan caption pada foto spesifik yang terikat pada proyek
  async updateCaption(projectId, photoId, caption) {
    const { data, error } = await supabase
      .from('project_photos')
      .update({ caption })
      .eq('id', photoId)
      .eq('project_id', projectId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const updated = data[0];
    return {
      ...updated,
      image_url: getImageUrl(updated.image_path),
    };
  },

  // Hapus satu foto dari database dan hapus berkas Storage terkait secara best-effort
  async remove(projectId, photoId) {
    const { data, error } = await supabase
      .from('project_photos')
      .delete()
      .eq('id', photoId)
      .eq('project_id', projectId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const deleted = data[0];
    if (deleted.image_path) {
      supabase.storage
        .from('project-images')
        .remove([deleted.image_path])
        .catch((cleanErr) => {
          console.warn('[STORAGE_DELETE_WARN] Gagal menghapus berkas foto di storage:', cleanErr);
        });
    }

    return {
      ...deleted,
      image_url: null,
    };
  },

  // Kumpulkan seluruh path berkas foto sebelum proyek dihapus cascade
  async getAllImagePaths(projectId) {
    const { data, error } = await supabase
      .from('project_photos')
      .select('image_path')
      .eq('project_id', projectId);

    if (error) {
      console.warn('[PROJECT_PHOTOS_WARN] Gagal membaca list path foto:', error.message || error);
      return [];
    }
    return (data || []).map((row) => row.image_path).filter(Boolean);
  },
};
