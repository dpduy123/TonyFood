"use client";

import ProductCard from "./product-card";
import type { CatalogProduct } from "../data/snacks";

export default function ProductGrid({
  products,
  loading,
  onAddToCart,
  onResetFilters,
}: {
  products: CatalogProduct[];
  loading: boolean;
  onAddToCart: (product: CatalogProduct) => void;
  onResetFilters: () => void;
}) {
  if (loading) {
    return (
      <div className="my-4 rounded-3xl border border-neutral-200/70 bg-white p-8 text-center">
        <p className="text-sm text-neutral-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="my-4 rounded-3xl border border-neutral-200/70 bg-white p-10 text-center shadow-2xs">
        <p className="mb-2 text-3xl" aria-hidden="true">📦</p>
        <p className="text-sm font-semibold text-neutral-800">
          Chưa tìm thấy mặt hàng phù hợp
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Thử xóa từ khóa tìm kiếm hoặc chọn khoảng giá khác nhé!
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 rounded-full bg-[#0047AB] px-4 py-2 text-xs font-semibold text-white"
        >
          Xem tất cả sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
