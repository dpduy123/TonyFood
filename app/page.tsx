"use client";

import React, { useState } from "react";
import { StatusBar } from "./components/StatusBar";
import { BottomNav, TabType } from "./components/BottomNav";
import { HomeScreen } from "./components/HomeScreen";
import { ExploreScreen } from "./components/ExploreScreen";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [viewMode, setViewMode] = useState<"dual" | "interactive">("dual");

  return (
    <div className="min-h-screen bg-[#ede9f2]/70 py-6 px-4 sm:px-8 flex flex-col items-center justify-center">
      {/* Top Preview Controls (Visible on medium+ screens) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-4xl mb-6 bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">
            TonyFood UI Preview
          </h2>
          <p className="text-xs text-neutral-500">
            Next.js 15 • Mobile-first UI
          </p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("dual")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "dual"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Mẫu 2 Màn Hình (Side-by-side)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("interactive")}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "interactive"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Tương tác 1 Màn Hình
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full flex items-center justify-center">
        {/* Dual Mode on Desktop */}
        {viewMode === "dual" ? (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 w-full max-w-5xl">
            {/* Screen 1: Home Screen */}
            <div className="w-full max-w-[390px] h-[780px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border-[8px] border-neutral-900/10 flex flex-col overflow-hidden relative">
              <StatusBar />
              <HomeScreen
                onAddToCart={() => alert("Đã thêm Potato Chips vào giỏ hàng!")}
                onExploreMore={() => setActiveTab("explore")}
              />
              <BottomNav
                activeTab="home"
                onTabChange={(tab) => {
                  if (tab === "explore") setViewMode("interactive");
                  setActiveTab(tab);
                }}
              />
              {/* Home indicator bar */}
              <div className="w-full flex justify-center pb-2 bg-white">
                <div className="w-32 h-1 bg-neutral-900/20 rounded-full" />
              </div>
            </div>

            {/* Screen 2: Explore Collections */}
            <div className="w-full max-w-[390px] h-[780px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border-[8px] border-neutral-900/10 flex flex-col overflow-hidden relative">
              <StatusBar />
              <ExploreScreen
                onSelectCollection={(id) => alert(`Đã chọn bộ sưu tập: ${id}`)}
              />
              <BottomNav
                activeTab="explore"
                onTabChange={(tab) => {
                  if (tab === "home") setViewMode("interactive");
                  setActiveTab(tab);
                }}
              />
              {/* Home indicator bar */}
              <div className="w-full flex justify-center pb-2 bg-white">
                <div className="w-32 h-1 bg-neutral-900/20 rounded-full" />
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Single Screen Mode */
          <div className="w-full max-w-[390px] h-[780px] bg-white rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] border-[8px] border-neutral-900/10 flex flex-col overflow-hidden relative">
            <StatusBar />

            {/* Screen Content */}
            {activeTab === "home" && (
              <HomeScreen
                onAddToCart={() => alert("Đã thêm Potato Chips vào giỏ hàng!")}
                onExploreMore={() => setActiveTab("explore")}
              />
            )}

            {activeTab === "explore" && (
              <ExploreScreen
                onSelectCollection={(id) => alert(`Đã chọn bộ sưu tập: ${id}`)}
              />
            )}

            {activeTab === "cart" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                  🛒
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Giỏ hàng của bạn</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">
                  Chưa có sản phẩm nào được chọn.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  className="mt-5 text-xs font-semibold px-4 py-2 bg-neutral-900 text-white rounded-full"
                >
                  Mua sắm ngay
                </button>
              </div>
            )}

            {activeTab === "favorite" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                  ❤️
                </div>
                <h3 className="text-lg font-bold text-neutral-900">Danh sách yêu thích</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">
                  Lưu các món ăn vặt bạn yêu thích tại đây.
                </p>
              </div>
            )}

            {/* Bottom Navigation */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Home indicator bar */}
            <div className="w-full flex justify-center pb-2 bg-white">
              <div className="w-32 h-1 bg-neutral-900/20 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
