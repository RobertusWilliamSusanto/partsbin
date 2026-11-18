import { supabase } from '../config/supabaseClient.js';

function createNotFoundError(message) {
  const err = new Error(message);
  err.code = 'PGRST116';
  return err;
}

export const projectItemModel = {
  async addItem(projectId, componentId, quantityNeeded) {
    const { data, error } = await supabase
      .from('project_items')
      .insert({
        project_id: projectId,
        component_id: componentId,
        quantity_needed: quantityNeeded,
      })
      .select(`
        *,
        components (
          id,
          name,
          category,
          stock,
          min_stock,
          unit_price,
          bin_location
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async removeItem(projectId, itemId) {
    // Memfilter berdasarkan project_id sekaligus item_id agar tidak salah menghapus item milik proyek lain
    const { data, error } = await supabase
      .from('project_items')
      .delete()
      .eq('id', itemId)
      .eq('project_id', projectId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw createNotFoundError('Item BOM tidak ditemukan pada proyek ini.');
    }
    return data[0];
  },
};
