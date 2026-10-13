import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client.
 * Safe to use in React client components.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null or throw clear actionable error
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
