import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function isAdminRequest(
  request: Request,
  client: SupabaseClient
): Promise<boolean> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return false;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role,is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to verify admin profile.");
  }

  return profile?.role === "ADMIN" && profile.is_active === true;
}
