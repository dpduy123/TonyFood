"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  SearchIcon,
  FilterIcon,
  ZaloIcon,
  ExternalLinkIcon,
} from "./components/icons";
import { CATEGORIES, PRICE_RANGES, PRODUCTS, Product } from "./data/snacks";

export default function CatalogPage() {
  const zaloUrl =
    process.env.NEXT_PUBLIC_ZALO_URL || "https://zalo.me/0817229979";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lọc sản phẩm theo Từ khóa, Danh mục và Khoảng giá (VND)
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "Tất cả" || item.category === selectedCategory;

      const priceConfig = PRICE_RANGES.find((p) => p.id === selectedPriceRange);
      const matchPrice = priceConfig
        ? item.price >= priceConfig.min && item.price <= priceConfig.max
        : true;

      return matchSearch && matchCategory && matchPrice;
    });
  }, [searchQuery, selectedCategory, selectedPriceRange]);

  // Hàm chuyển hướng sang Zalo kèm copy thông tin sản phẩm
  const handleChatZalo = (product?: Product) => {
    if (product) {
      const orderText = `Xin chào Tony Food, mình muốn tư vấn đặt hàng món: ${product.name} (${product.unit}) - Giá: ${product.priceFormatted}`;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(orderText).catch(() => {});
      }
      setToastMessage(
        `Đã sao chép: "${product.name}". Đang mở Zalo shop (0817229979)...`
      );
    } else {
      setToastMessage("Đang chuyển hướng đến Zalo Tony Food (0817229979)...");
    }

    setTimeout(() => {
      window.open(zaloUrl, "_blank", "noopener,noreferrer");
    }, 600);

    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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

          {/* Nút Chat Zalo trực tiếp trên Header */}
          <button
            type="button"
            onClick={() => handleChatZalo()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0068FF] hover:bg-[#0052cc] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
            title="Chat tư vấn qua Zalo"
          >
            <ZaloIcon className="w-4 h-4" />
            <span>Zalo Shop</span>
          </button>
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
            {CATEGORIES.map((cat) => {
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
        {filteredProducts.length === 0 ? (
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
          <div className="flex flex-col gap-3.5">
            {filteredProducts.map((item) => (
              <div
                key={item.id}
                style={{ backgroundColor: item.bgColor }}
                className="rounded-[24px] p-4 sm:p-5 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between border border-black/5 shadow-xs hover:shadow-md transition-all group"
              >
                {/* Thông tin bên trái */}
                <div className="relative z-10 max-w-full sm:max-w-[60%] flex flex-col justify-between mb-3 sm:mb-0">
                  <div>
                    {item.badge && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-neutral-800 mb-2 border border-neutral-200/50 shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-600 font-medium mt-1 leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-extrabold text-red-600 tracking-tight">
                      {item.priceFormatted}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                      / {item.unit}
                    </span>
                  </div>

                  {/* Nút bấm Chat Zalo Đặt Mua */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => handleChatZalo(item)}
                      className="inline-flex items-center gap-2 bg-[#18181b] hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xs active:scale-95 transition-all"
                    >
                      <ZaloIcon className="w-4 h-4" />
                      <span>Chat Zalo để mua</span>
                      <ExternalLinkIcon className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Hình ảnh bên phải */}
                <div className="relative w-full sm:w-[38%] h-36 sm:h-32 flex items-center justify-center sm:justify-end overflow-hidden pointer-events-none rounded-xl">
                  <div className="relative w-full h-full scale-[1.03] group-hover:scale-[1.08] transition-transform duration-300">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 250px"
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
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
