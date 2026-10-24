"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SearchIcon,
  FilterIcon,
  ZaloIcon,
} from "./components/icons";
import { useCart } from "./components/cart-provider";
import { CATEGORIES, PRICE_RANGES } from "./data/snacks";
import type { CatalogProduct } from "./data/snacks";
import { logClientRequestFailure } from "@/lib/client-request-log";
import { CatalogRequestError, loadCatalog } from "./data/catalog-client";

export default function CatalogPage() {
  const zaloUrl =
    process.env.NEXT_PUBLIC_ZALO_URL || "https://zalo.me/0817229979";

  const { addItem, count } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const catalog = await loadCatalog();
        if (active) {
          setProducts(catalog.products);
          setCategories(["Tất cả", ...catalog.categories]);
        }
      } catch (error) {
        if (active) {
          logClientRequestFailure(
            "GET /api/products",
            error instanceof CatalogRequestError ? error.status : null,
            error
          );
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  // Lọc sản phẩm theo Từ khóa, Danh mục và Khoảng giá (VND)
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
      const matchSearch =
        !normalizedQuery ||
        item.name.toLocaleLowerCase().includes(normalizedQuery) ||
        item.category.toLocaleLowerCase().includes(normalizedQuery) ||
        (item.tags ?? []).some((tag) =>
          tag.toLocaleLowerCase().includes(normalizedQuery)
        );

      const matchCategory =
        selectedCategory === "Tất cả" || item.category === selectedCategory;

      const priceConfig = PRICE_RANGES.find((p) => p.id === selectedPriceRange);
      const matchPrice = priceConfig
        ? item.price >= priceConfig.min && item.price <= priceConfig.max
        : true;

      return matchSearch && matchCategory && matchPrice;
    });
  }, [products, searchQuery, selectedCategory, selectedPriceRange]);

  const handleChatZalo = () => {
    setToastMessage("Đang chuyển hướng đến Zalo Tony Food (0817229979)...");

    setTimeout(() => {
      window.open(zaloUrl, "_blank", "noopener,noreferrer");
    }, 600);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddToCart = (product: CatalogProduct) => {
    const added = addItem(product.slug, product.stock);
    setToastMessage(
      added
        ? `Đã thêm "${product.name}" vào giỏ hàng.`
        : `Số lượng "${product.name}" trong giỏ đã đạt tồn kho.`
    );
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 flex flex-col items-center">
      {/* Toast Thông Báo */}
      {toastMessage && (
        <div className="fixed top-5 z-50 px-5 py-3 rounded-full bg-neutral-900 text-white text-xs sm:text-sm font-medium shadow-2xl flex items-center gap-2 animate-bounce transition-all">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="w-full max-w-md md:max-w-xl lg:max-w-2xl px-4 sm:px-6 pt-5 pb-24 flex flex-col">
        {/* Header với Logo Tony Food chính thức */}
        <header className="flex items-center justify-between mb-4 bg-white p-3.5 rounded-2xl border border-neutral-200/70 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-100 bg-white">
              <Image
                src="/images/logo.png"
                alt="Tony Food Logo"
                fill
                sizes="48px"
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#0047AB] leading-tight">
                TONY <span className="text-[#E5A800]">FOOD</span>
              </h1>
              <p className="text-[11px] text-neutral-500 font-medium">
                Tuyển sỉ toàn miền Nam • Giá tận xưởng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0047AB] hover:bg-[#003987] text-white text-xs font-semibold shadow-xs transition-colors"
              aria-label={`Giỏ hàng, ${count} sản phẩm`}
            >
              <span aria-hidden="true">🛒</span>
              <span>Giỏ hàng</span>
              <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#0047AB] flex items-center justify-center text-[10px] font-bold">
                {count}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleChatZalo}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
              title="Chat tư vấn qua Zalo"
            >
              <ZaloIcon className="w-4 h-4" />
              <span>Zalo Shop</span>
            </button>
          </div>
        </header>

        {/* Ảnh Bìa Danh Mục / Banner Poster Giới Thiệu */}
        <section className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden mb-5 border border-neutral-200/80 shadow-xs group">
          <Image
            src="/images/banner.png"
            alt="Thực Phẩm Tony Food - Tuyển Sỉ Toàn Miền Nam"
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E5A800] text-neutral-900 px-2 py-0.5 rounded-md w-fit mb-1">
              Ưu đãi hấp dẫn
            </span>
            <p className="text-xs sm:text-sm font-semibold leading-snug">
              Sỉ lộn xộn từ 10kg • Giá tận xưởng tốt nhất khu vực
            </p>
          </div>
        </section>

        {/* Thanh Tìm Kiếm Món Ăn */}
        <div className="relative mb-4">
          <div className="w-full bg-white rounded-full py-3.5 px-4 flex items-center gap-3 shadow-2xs border border-neutral-200/80 focus-within:ring-2 focus-within:ring-blue-400 transition-all">
            <SearchIcon className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm ba chỉ bò, xúc xích, phô mai, lẩu..."
              className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-neutral-400 hover:text-neutral-600 px-2"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Bộ Lọc 1: Danh Mục Sản Phẩm (Category Pills) */}
        <div className="mb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all select-none ${
                    isActive
                      ? "bg-[#0047AB] text-white shadow-xs"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/70"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bộ Lọc 2: Khoảng Giá Tiền (VND) */}
        <div className="mb-5 bg-white p-3.5 rounded-2xl border border-neutral-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 mb-2.5">
            <FilterIcon className="w-3.5 h-3.5" />
            <span>Khoảng giá sản phẩm (VND):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {PRICE_RANGES.map((price) => {
              const isActive = selectedPriceRange === price.id;
              return (
                <button
                  key={price.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(price.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all ${
                    isActive
                      ? "bg-neutral-900 text-white font-semibold"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {price.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tiêu đề & Đếm số lượng sản phẩm */}
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-base font-bold text-neutral-900">
            {selectedCategory === "Tất cả" ? "Danh mục sản phẩm" : selectedCategory}
          </h2>
          <span className="text-xs font-medium text-neutral-500">
            {filteredProducts.length} mặt hàng
          </span>
        </div>

        {/* Danh Sách Mặt Hàng (Product Catalog Grid) */}
        {productsLoading ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/70 my-4">
            <p className="text-sm text-neutral-500">Đang tải sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-neutral-200/70 shadow-2xs my-4">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-sm font-semibold text-neutral-800">
              Chưa tìm thấy mặt hàng phù hợp
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Thử xóa từ khóa tìm kiếm hoặc chọn khoảng giá khác nhé!
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Tất cả");
                setSelectedPriceRange("all");
              }}
              className="mt-4 px-4 py-2 bg-[#0047AB] text-white text-xs font-semibold rounded-full"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filteredProducts.map((item) => (
              <article
                key={item.id}
                className="group min-w-0 overflow-hidden rounded-xl border border-[#161064]/30 bg-white shadow-xs transition-shadow hover:shadow-md sm:rounded-2xl"
              >
                <div
                  className="relative aspect-[4/5] overflow-hidden"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 33vw, 220px"
                    className="object-contain p-1 transition-transform duration-300 group-hover:scale-105 sm:p-2"
                  />
                  {(item.tags?.[0] || item.badge) && (
                    <span className="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold text-neutral-800 shadow-xs sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]">
                      {item.tags?.[0] ?? item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-1 right-1 max-w-[90%] truncate bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm sm:bottom-2 sm:right-2 sm:px-2 sm:text-sm">
                    {item.priceFormatted}
                  </span>
                </div>
                <div className="flex min-h-[4.5rem] flex-col bg-[#161064] px-1.5 py-2 text-center text-white sm:min-h-24 sm:px-2.5 sm:py-2.5">
                  <h3 className="line-clamp-2 text-[10px] font-bold leading-tight sm:text-sm">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-[9px] text-white/80 sm:text-xs">
                    {item.unit}
                  </p>
                </div>
                <div className="p-1 sm:p-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock < 1}
                    aria-label={`${item.stock < 1 ? "Hết hàng" : "Thêm vào giỏ hàng"}: ${item.name}`}
                    className="w-full rounded-md bg-[#0047AB] px-1 py-1.5 text-[9px] font-semibold leading-tight text-white transition-colors hover:bg-[#003987] disabled:cursor-not-allowed disabled:bg-neutral-300 sm:rounded-lg sm:px-2 sm:py-2 sm:text-xs"
                  >
                    {item.stock < 1 ? "Hết hàng" : "Thêm vào giỏ"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Thông tin Cửa hàng Footer */}
        <footer className="mt-8 pt-5 border-t border-neutral-200 text-center text-xs text-neutral-500 flex flex-col gap-1.5">
          <p className="font-bold text-neutral-800">
            THỰC PHẨM TONY FOOD
          </p>
          <p>📍 55/4 Phan Đình Phùng, Phường Phú Nhuận, TP. Hồ Chí Minh</p>
          <p>
            📞 Hotline / Zalo:{" "}
            <a
              href="tel:0817229979"
              className="text-[#0068FF] font-semibold hover:underline"
            >
              0817229979
            </a>
          </p>
        </footer>
      </main>

      {/* Nút Chat Zalo Nổi (Floating Button) cố định góc dưới */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => handleChatZalo()}
          className="group relative flex items-center gap-2 pl-3.5 pr-4 py-3 rounded-full bg-[#0068FF] hover:bg-[#0052cc] text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer"
          title="Bấm để chat Zalo với Tony Food (0817229979)"
        >
          {/* Vòng hiệu ứng Radar xanh */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500"></span>
          </span>

          <ZaloIcon className="w-6 h-6" />
          <span className="text-xs font-bold tracking-tight">Tư Vấn Zalo</span>
        </button>
      </div>
    </div>
  );
}
