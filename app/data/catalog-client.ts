import type { CatalogProduct } from "./snacks";

export interface CatalogData {
  products: CatalogProduct[];
  categories: string[];
}

interface CatalogResponse extends CatalogData {
  error?: string;
}

export class CatalogRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "CatalogRequestError";
  }
}

const cacheLifetimeMs = 15_000;
let cachedCatalog: { data: CatalogData; expiresAt: number } | null = null;
let pendingRequest: Promise<CatalogData> | null = null;
let cacheGeneration = 0;

export function invalidateCatalogCache() {
  cacheGeneration += 1;
  cachedCatalog = null;
  pendingRequest = null;
}

export function loadCatalog(): Promise<CatalogData> {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return Promise.resolve(cachedCatalog.data);
  }
  if (pendingRequest) return pendingRequest;

  const generation = cacheGeneration;
  const request = (async () => {
    const response = await fetch("/api/products", { cache: "no-store" });
    const payload = (await response.json()) as CatalogResponse;
    if (!response.ok || !Array.isArray(payload.products)) {
      throw new CatalogRequestError(
        payload.error ?? "Không thể tải danh sách sản phẩm.",
        response.status
      );
    }

    const data: CatalogData = {
      products: payload.products,
      categories: Array.isArray(payload.categories) ? payload.categories : [],
    };
    if (generation === cacheGeneration) {
      cachedCatalog = { data, expiresAt: Date.now() + cacheLifetimeMs };
    }
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
