import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const publicCatalogCacheTag = "public-catalog";

export async function getPublicCatalog() {
  "use cache";

  cacheLife({
    stale: 30,
    revalidate: 30,
    expire: 120,
  });
  cacheTag(publicCatalogCacheTag);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("api_public_catalog");
  if (error) {
    console.error("Supabase public catalog RPC failed.", error.message);
    throw new Error("Could not load the public catalog.");
  }
  return data;
}
