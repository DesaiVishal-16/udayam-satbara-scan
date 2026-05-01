import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== SUPABASE INIT ===');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase environment variables!');
} else {
  console.log('Supabase env vars loaded successfully');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export const STORAGE_BUCKET = 'land-records';
