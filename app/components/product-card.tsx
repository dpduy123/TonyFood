"use client";

import Image from "next/image";
import type { CatalogProduct } from "../data/snacks";

export default function ProductCard({
  product,
  onAddToCart,
}: {
  product: CatalogProduct;
  onAddToCart: (product: CatalogProduct) => void;
}) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-[#161064]/30 bg-white shadow-xs transition-shadow hover:shadow-md sm:rounded-2xl">
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ backgroundColor: product.bgColor }}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 33vw, 220px"
          className="object-contain p-1 transition-transform duration-300 group-hover:scale-105 sm:p-2"
        />
        {(product.tags?.[0] || product.badge) && (
          <span className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-neutral-800 shadow-xs sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
            {product.tags?.[0] ?? product.badge}
          </span>
        )}
        <span className="absolute bottom-1 right-1 max-w-[90%] truncate bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm sm:bottom-2 sm:right-2 sm:px-2 sm:text-sm">
          {product.priceFormatted}
        </span>
      </div>
      <div className="flex min-h-[4.5rem] flex-col bg-[#161064] px-1.5 py-2 text-center text-white sm:min-h-24 sm:px-2.5 sm:py-2.5">
        <h3 className="line-clamp-2 text-[10px] font-bold leading-tight sm:text-sm">
          {product.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[9px] text-white/80 sm:text-xs">
          {product.unit}
        </p>
      </div>
      <div className="p-1 sm:p-2">
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={product.stock < 1}
          aria-label={`${product.stock < 1 ? "Hết hàng" : "Thêm vào giỏ hàng"}: ${product.name}`}
          className="w-full rounded-md bg-[#0047AB] px-1 py-1.5 text-[9px] font-semibold leading-tight text-white transition-colors hover:bg-[#003987] disabled:cursor-not-allowed disabled:bg-neutral-300 sm:rounded-lg sm:px-2 sm:py-2 sm:text-xs"
        >
          {product.stock < 1 ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </article>
  );
}
