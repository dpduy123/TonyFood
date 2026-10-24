"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ZaloIcon } from "./components/icons";
import CategoryFilter from "./components/category-filter";
import { useCart } from "./components/cart-provider";
import { CATEGORIES, PRICE_RANGES } from "./data/snacks";
import type { CatalogProduct } from "./data/snacks";
import { logClientRequestFailure } from "@/lib/client-request-log";
import { CatalogRequestError, loadCatalog } from "./data/catalog-client";
import PriceRangeFilter from "./components/price-range-filter";
import ProductGrid from "./components/product-grid";
import SearchBar from "./components/search-bar";

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

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm kiếm ba chỉ bò, xúc xích, phô mai, lẩu..."
        />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <PriceRangeFilter
          ranges={PRICE_RANGES}
          selectedRange={selectedPriceRange}
          onSelect={setSelectedPriceRange}
        />

        {/* Tiêu đề & Đếm số lượng sản phẩm */}
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-base font-bold text-neutral-900">
            {selectedCategory === "Tất cả" ? "Danh mục sản phẩm" : selectedCategory}
          </h2>
          <span className="text-xs font-medium text-neutral-500">
            {filteredProducts.length} mặt hàng
          </span>
        </div>

        <ProductGrid
          products={filteredProducts}
          loading={productsLoading}
          onAddToCart={handleAddToCart}
          onResetFilters={() => {
            setSearchQuery("");
            setSelectedCategory("Tất cả");
            setSelectedPriceRange("all");
          }}
        />

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
