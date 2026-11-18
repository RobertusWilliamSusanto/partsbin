import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Kenapa dicek di awal? Supaya kesalahan konfigurasi .env langsung terlihat jelas saat server dinyalakan.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL dan SUPABASE_KEY wajib diisi di file api/.env sebelum menjalankan server.'
  );
}

// Konvensi Modul 1: mengekspor instance `supabase` dari config/supabaseClient.js
export const supabase = createClient(supabaseUrl, supabaseKey);
