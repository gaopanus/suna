import { createClient } from '@supabase/supabase-js';

// It's crucial to use environment variables for Supabase URL and Anon Key.
// These should be prefixed with VITE_ for Vite projects to be exposed to the client-side code.
// Example: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Using placeholder values for now. Replace these with your actual environment variables.
const placeholderSupabaseUrl = 'YOUR_SUPABASE_URL_PLACEHOLDER';
const placeholderSupabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY_PLACEHOLDER';

// Check if environment variables are set, otherwise use placeholders and log a warning.
let supabaseUrlToUse = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKeyToUse = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrlToUse || !supabaseAnonKeyToUse) {
  console.warn(
    'Supabase URL or Anon Key is not set in environment variables. ' +
    'Using placeholder values. Please configure VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY in your .env file for the application to work correctly.'
  );
  supabaseUrlToUse = supabaseUrlToUse || placeholderSupabaseUrl;
  supabaseAnonKeyToUse = supabaseAnonKeyToUse || placeholderSupabaseAnonKey;
}

export const supabase = createClient(supabaseUrlToUse, supabaseAnonKeyToUse);

// How to set up environment variables:
// 1. Create a file named .env in the root of your `frontend-vue` project.
// 2. Add your Supabase credentials to the .env file like this:
//    VITE_SUPABASE_URL=https://your-project-id.supabase.co
//    VITE_SUPABASE_ANON_KEY=your-anon-key
// 3. Make sure .env is listed in your .gitignore file to avoid committing secrets.
// 4. Restart your Vite development server after creating/modifying the .env file.

// Example usage in a component or store:
// import { supabase } from '@/services/supabaseClient';
//
// async function fetchSomeData() {
//   const { data, error } = await supabase.from('your_table').select('*');
//   if (error) console.error('Error fetching data:', error);
//   else console.log('Fetched data:', data);
// }
