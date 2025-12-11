import { createClient } from '@supabase/supabase-js';

// Menggunakan variable environment VITE (wajib pakai awalan VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);