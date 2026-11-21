import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Muat .env baik saat server dijalankan dari direktori root repo maupun langsung dari api/
dotenv.config();
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL dan SUPABASE_KEY wajib diisi di file api/.env sebelum menjalankan server.'
  );
}

// Konvensi Modul 1: mengekspor instance `supabase` dari config/supabaseClient.js
export const supabase = createClient(supabaseUrl, supabaseKey);
