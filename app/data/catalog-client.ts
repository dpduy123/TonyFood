import type { CatalogProduct } from "./snacks";

export interface CatalogData {
  products: CatalogProduct[];
  categories: string[];
}

interface CatalogResponse extends CatalogData {
  error?: string;
}

const cacheLifetimeMs = 15_000;
let cachedCatalog: { data: CatalogData; expiresAt: number } | null = null;
let pendingRequest: Promise<CatalogData> | null = null;

export function loadCatalog(): Promise<CatalogData> {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return Promise.resolve(cachedCatalog.data);
  }
  if (pendingRequest) return pendingRequest;

  const request = (async () => {
    const response = await fetch("/api/products", { cache: "no-store" });
    const payload = (await response.json()) as CatalogResponse;
    if (!response.ok || !Array.isArray(payload.products)) {
      throw new Error(payload.error ?? "Không thể tải danh sách sản phẩm.");
    }

    const data: CatalogData = {
      products: payload.products,
      categories: Array.isArray(payload.categories) ? payload.categories : [],
    };
    cachedCatalog = { data, expiresAt: Date.now() + cacheLifetimeMs };
    return data;
  })();

  pendingRequest = request;
  void request.finally(() => {
    if (pendingRequest === request) pendingRequest = null;
  }).catch(() => {
    // The original promise is returned to the caller, which handles and logs the failure.
  });
  return request;
}
