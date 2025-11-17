/**
 * Supabase Client Exports
 *
 * Usage guide:
 * - Use `createClient()` from './client' in Client Components
 * - Use `createClient()` from './server' in Server Components and Route Handlers
 * - Use `supabaseAdmin` from './admin' only in server-side code for privileged operations
 */

export { createClient as createBrowserClient, supabase } from './client';
export { createClient as createServerClient } from './server';
export { supabaseAdmin, createAdminClient } from './admin';
