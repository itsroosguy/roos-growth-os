import { createClient } from "@supabase/supabase-js";

/**
 * Creates a privileged Supabase admin client using the service-role key.
 * 
 * SECURITY RULES:
 * - NEVER invoke this in browser components or user-facing route handlers.
 * - Used exclusively for system operations:
 *   1. Incoming Meta WhatsApp Webhook ingestion before tenant resolution
 *   2. Job Queue Cron worker (/api/cron/process-jobs)
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY CRITICAL: createAdminClient() cannot be invoked from the browser."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
