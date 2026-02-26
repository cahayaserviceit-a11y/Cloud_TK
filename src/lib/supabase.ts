import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : '');

// JIKA ANDA INGIN HARDCODE (TIDAK DISARANKAN TAPI BISA):
// const supabaseUrl = 'https://xyz.supabase.co';
// const supabaseAnonKey = 'eyJhbG...';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Aplikasi mungkin tidak berfungsi di cloud.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
