import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bfqvohlqyrkimkwclpea.supabase.co';
const supabaseAnonKey = 'sb_publishable_M8XuBnMSWkabO6Z-sEh9KA_OtaJfzZF';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Aplikasi mungkin tidak berfungsi di cloud.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
