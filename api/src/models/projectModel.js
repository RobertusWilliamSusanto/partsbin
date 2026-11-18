import { supabase } from '../config/supabaseClient.js';

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

export const projectModel = {
  async getAll() {
    // Mengambil nested project_items + components sekaligus agar controller bisa menghitung readiness % tiap proyek
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_WITH_BOM_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_WITH_BOM_SELECT)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    // .select() wajib agar baris kosong dapat terdeteksi sebagai 404 Not Found
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw createNotFoundError('Proyek tidak ditemukan.');
    }
    return data[0];
  },
};
