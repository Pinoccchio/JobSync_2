import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client for Client Components
 * Uses cookies for session management to sync with server-side auth
 * This replaces the old localStorage-based client
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
