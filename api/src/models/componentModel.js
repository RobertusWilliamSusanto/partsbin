import { supabase } from '../config/supabaseClient.js';

function createNotFoundError(message) {
  const err = new Error(message);
  // Kenapa pakai PGRST116? Agar seragam dengan kode error Supabase .single() dan otomatis dipetakan ke 404.
  err.code = 'PGRST116';
  return err;
}

export const componentModel = {
  async getAll() {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    // Nested select untuk menampilkan daftar proyek yang menggunakan komponen ini di halaman detail
    const { data, error } = await supabase
      .from('components')
      .select(`
        *,
        project_items (
          id,
          quantity_needed,
          projects (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('components')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('components')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStock(id, stock) {
    const { data, error } = await supabase
      .from('components')
      .update({ stock })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    // Kenapa wajib .select() pada delete? Tanpa .select(), Supabase tidak mengembalikan baris terhapus
    // sehingga kita tidak bisa membedakan antara berhasil menghapus atau ID memang tidak ditemukan (404).
    const { data, error } = await supabase
      .from('components')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw createNotFoundError('Komponen tidak ditemukan.');
    }
    return data[0];
  },
};
