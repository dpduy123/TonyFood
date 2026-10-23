"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { logClientRequestFailure } from "@/lib/client-request-log";
import { invalidateCatalogCache } from "../data/catalog-client";

interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

interface CatalogTag {
  id: string;
  name: string;
  slug: string;
}

interface ManagedProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  unit: string;
  stock: number;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  category_id: string;
  categoryName: string;
  imageUrl: string;
  tags: { id: string; name: string }[];
}

interface CatalogResponse {
  categories: CatalogCategory[];
  tags: CatalogTag[];
  products: ManagedProduct[];
}

interface ProductDraft {
  id: string | null;
  name: string;
  slug: string;
  subtitle: string;
  price: string;
  unit: string;
  stock: string;
  categoryId: string;
  tagIds: string[];
  imageUrl: string;
  status: "ACTIVE" | "DRAFT";
}

type CatalogAction =
  | {
      action: "save_product";
      product: {
        id: string | null;
        name: string;
        slug: string;
        subtitle: string;
        price: number;
        unit: string;
        stock: number;
        categoryId: string;
        tagIds: string[];
        imageUrl: string | null;
        status: "ACTIVE" | "DRAFT";
      };
    }
  | { action: "archive_product"; productId: string }
  | { action: "save_category" | "delete_category"; id?: string; name?: string; slug?: string }
  | { action: "save_tag" | "delete_tag"; id?: string; name?: string; slug?: string };

const emptyDraft: ProductDraft = {
  id: null,
  name: "",
  slug: "",
  subtitle: "",
  price: "",
  unit: "",
  stock: "0",
  categoryId: "",
  tagIds: [],
  imageUrl: "",
  status: "ACTIVE",
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}

function makeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminCatalogPanel({
  accessToken,
}: {
  accessToken: string;
}) {
  const [catalog, setCatalog] = useState<CatalogResponse>({
    categories: [],
    tags: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<"product" | "categories" | "tags" | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [editingListItem, setEditingListItem] = useState<{ id: string; name: string } | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/catalog", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      status = response.status;
      const payload = (await response.json()) as CatalogResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Không thể tải danh mục.");
      setCatalog(payload);
    } catch (loadError) {
      logClientRequestFailure("GET /api/admin/catalog", status, loadError);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog]);

  async function mutateCatalog(action: CatalogAction): Promise<{ productId?: string }> {
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      });
      status = response.status;
      const payload = (await response.json()) as {
        productId?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Không thể lưu thay đổi.");
      if (
        action.action === "save_product" ||
        action.action === "archive_product" ||
        action.action === "save_category" ||
        action.action === "delete_category" ||
        action.action === "save_tag" ||
        action.action === "delete_tag"
      ) {
        invalidateCatalogCache();
      }
      return payload;
    } catch (error) {
      logClientRequestFailure("POST /api/admin/catalog", status, error);
      throw error;
    }
  }

  function editProduct(product?: ManagedProduct) {
    setDraft(
      product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            subtitle: product.short_description ?? "",
            price: String(product.price),
            unit: product.unit,
            stock: String(product.stock),
            categoryId: product.category_id,
            tagIds: product.tags.map((tag) => tag.id),
            imageUrl: product.imageUrl,
            status: product.status === "DRAFT" ? "DRAFT" : "ACTIVE",
          }
        : {
            ...emptyDraft,
            categoryId: catalog.categories[0]?.id ?? "",
          }
    );
    setImageFile(null);
    setDialog("product");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const product = {
        ...draft,
        slug: draft.slug || makeSlug(draft.name),
        subtitle: draft.subtitle,
        price: Number(draft.price),
        stock: Number(draft.stock),
        imageUrl: draft.imageUrl || null,
      };
      const savedProduct = await mutateCatalog({
        action: "save_product",
        product,
      });
      const productId = draft.id ?? savedProduct.productId;
      if (!productId) {
        throw new Error("Lưu sản phẩm không trả về mã sản phẩm.");
      }

      if (imageFile) {
        const formData = new FormData();
        formData.set("file", imageFile);
        formData.set("productId", productId);
        let uploadStatus: number | null = null;
        try {
          const upload = await fetch("/api/admin/catalog/image", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });
          uploadStatus = upload.status;
          const uploadPayload = (await upload.json()) as { url?: string; error?: string };
          if (!upload.ok || !uploadPayload.url) {
            throw new Error(uploadPayload.error ?? "Image upload request failed.");
          }
          await mutateCatalog({
            action: "save_product",
            product: { ...product, id: productId, imageUrl: uploadPayload.url },
          });
        } catch (uploadError) {
          logClientRequestFailure(
            "POST /api/admin/catalog/image",
            uploadStatus,
            uploadError
          );
          throw uploadError;
        }
      }

      setDialog(null);
      await loadCatalog();
    } catch {
      // The failing request is logged at its request boundary.
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(product: ManagedProduct) {
    if (saving || !window.confirm(`Ẩn sản phẩm "${product.name}" khỏi cửa hàng?`)) return;
    setSaving(true);
    try {
      await mutateCatalog({ action: "archive_product", productId: product.id });
      await loadCatalog();
    } catch {
      // The failing request is logged by mutateCatalog.
    } finally {
      setSaving(false);
    }
  }

  async function saveListItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nameDraft.trim();
    if (!name) return;
    setSaving(true);
    try {
      const action =
        dialog === "categories" ? "save_category" as const : "save_tag" as const;
      await mutateCatalog({
        action,
        id: editingListItem?.id,
        name,
        slug: makeSlug(name),
      });
      setNameDraft("");
      setEditingListItem(null);
      await loadCatalog();
    } catch {
      // The failing request is logged by mutateCatalog.
    } finally {
      setSaving(false);
    }
  }

  async function deleteListItem(id: string, name: string) {
    const isCategory = dialog === "categories";
    const label = isCategory ? "danh mục" : "nhãn";
    if (!window.confirm(`Xóa ${label} "${name}"?`)) return;
    setSaving(true);
    try {
      await mutateCatalog({
        action: isCategory ? "delete_category" : "delete_tag",
        id,
      });
      await loadCatalog();
    } catch {
      // The failing request is logged by mutateCatalog.
    } finally {
      setSaving(false);
    }
  }

  const activeProducts = catalog.products.filter((product) => product.status !== "ARCHIVED");

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Sản phẩm</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Quản lý danh mục, nhãn, giá bán và tồn kho.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingListItem(null);
              setNameDraft("");
              setDialog("categories");
            }}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold"
          >
            Danh mục
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingListItem(null);
              setNameDraft("");
              setDialog("tags");
            }}
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold"
          >
            Nhãn
          </button>
          <button
            type="button"
            onClick={() => editProduct()}
            disabled={catalog.categories.length === 0}
            className="rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-300"
          >
            + Thêm sản phẩm
          </button>
        </div>
      </div>

      {loading ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
          Đang tải sản phẩm...
        </p>
      ) : activeProducts.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
          Chưa có sản phẩm. Hãy thêm sản phẩm hoặc kiểm tra dữ liệu Supabase.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-100">
            {activeProducts.map((product) => (
              <article key={product.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{product.name}</h3>
                    {product.status === "DRAFT" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        Bản nháp
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {product.categoryName} · {product.unit} · Tồn kho: {product.stock}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0047AB]">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <span key={tag.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editProduct(product)}
                    className="rounded-full border border-neutral-300 px-3 py-2 text-xs font-semibold"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void archiveProduct(product)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    Ẩn
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setDialog(null);
          }}
        >
          {dialog === "product" ? (
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-dialog-title"
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 id="product-dialog-title" className="text-xl font-bold">
                    {draft.id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Giá và tồn kho được lưu trong Supabase.
                  </p>
                </div>
                <button type="button" onClick={() => setDialog(null)} disabled={saving} aria-label="Đóng" className="text-2xl leading-none text-neutral-500">
                  ×
                </button>
              </div>
              <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium sm:col-span-2">
                  Tên sản phẩm
                  <input
                    required
                    maxLength={160}
                    value={draft.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setDraft((current) => ({
                        ...current,
                        name,
                        slug: current.id ? current.slug : makeSlug(name),
                      }));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm font-medium">
                  Giá (₫)
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={draft.price}
                    onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm font-medium">
                  Số lượng tồn kho
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={draft.stock}
                    onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm font-medium">
                  Đơn vị / quy cách
                  <input
                    required
                    maxLength={80}
                    placeholder="Khay 500g"
                    value={draft.unit}
                    onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                  />
                </label>
                <label className="text-sm font-medium">
                  Danh mục
                  <select
                    required
                    value={draft.categoryId}
                    onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5"
                  >
                    {catalog.categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium sm:col-span-2">
                  Mô tả ngắn
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={draft.subtitle}
                    onChange={(event) => setDraft((current) => ({ ...current, subtitle: event.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5"
                  />
                </label>
                <fieldset className="sm:col-span-2">
                  <legend className="text-sm font-medium">Nhãn sản phẩm (có thể chọn nhiều)</legend>
                  {catalog.tags.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {catalog.tags.map((tag) => (
                        <label key={tag.id} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={draft.tagIds.includes(tag.id)}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                tagIds: event.target.checked
                                  ? [...current.tagIds, tag.id]
                                  : current.tagIds.filter((id) => id !== tag.id),
                              }))
                            }
                            className="accent-[#0047AB]"
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-neutral-500">Chưa có nhãn. Đóng hộp thoại này để tạo nhãn.</p>
                  )}
                </fieldset>
                <label className="text-sm font-medium">
                  Trạng thái
                  <select
                    value={draft.status}
                    onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as "ACTIVE" | "DRAFT" }))}
                    className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5"
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="DRAFT">Bản nháp</option>
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Ảnh sản phẩm (FoodImage/{`<productId>`}/image, tối đa 5 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full text-xs"
                  />
                </label>
                {draft.imageUrl && !imageFile && (
                  <p className="text-xs text-neutral-500 sm:col-span-2">
                    Đang dùng ảnh đã tải lên. Chọn file mới để thay ảnh.
                  </p>
                )}
                        <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4 sm:col-span-2">
                  <button type="button" onClick={() => setDialog(null)} disabled={saving} className="rounded-full border border-neutral-300 px-4 py-2 text-sm">
                    Hủy
                  </button>
                  <button type="submit" disabled={saving || catalog.categories.length === 0} className="rounded-full bg-[#0047AB] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {saving ? "Đang lưu..." : "Lưu sản phẩm"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="list-dialog-title"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 id="list-dialog-title" className="text-xl font-bold">
                  {dialog === "categories" ? "Quản lý danh mục" : "Quản lý nhãn"}
                </h2>
                <button type="button" onClick={() => setDialog(null)} aria-label="Đóng" className="text-2xl leading-none text-neutral-500">×</button>
              </div>
              <form onSubmit={saveListItem} className="flex gap-2">
                <input
                  required
                  maxLength={dialog === "categories" ? 100 : 60}
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  placeholder={dialog === "categories" ? "Tên danh mục" : "Tên nhãn"}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
                />
                <button type="submit" disabled={saving} className="rounded-full bg-[#0047AB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {editingListItem ? "Cập nhật" : "Thêm"}
                </button>
              </form>
              <ul className="mt-4 divide-y divide-neutral-100">
                {(dialog === "categories" ? catalog.categories : catalog.tags).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingListItem({ id: item.id, name: item.name });
                          setNameDraft(item.name);
                        }}
                        className="text-xs font-semibold text-[#0047AB]"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void deleteListItem(item.id, item.name)}
                        className="text-xs font-semibold text-red-600 disabled:opacity-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
