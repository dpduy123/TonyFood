"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SearchIcon, HeartIcon } from "./icons";
import { CATEGORIES, FEATURED_HERO } from "../data/snacks";

interface HomeScreenProps {
  onAddToCart?: () => void;
  onExploreMore?: () => void;
}

export function HomeScreen({ onAddToCart, onExploreMore }: HomeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("Chips");
  const [isFavorite, setIsFavorite] = useState(true);

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 overflow-y-auto no-scrollbar">
      {/* Header: Greeting & Profile */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900 leading-tight">
            Hi, Jack.L
          </h1>
          <p className="text-xs text-neutral-400 font-normal mt-0.5">
            Best snacks for you
          </p>
        </div>
        <div className="relative w-11 h-11 rounded-full overflow-hidden border border-neutral-100 shadow-xs ring-1 ring-neutral-200/60">
          <Image
            src="/images/avatar.png"
            alt="Jack.L Profile"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5">
        <div className="w-full bg-[#f4f4f5]/90 rounded-full py-3 px-4 flex items-center gap-3 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-neutral-200">
          <SearchIcon className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search here"
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all shrink-0 select-none ${
                isActive
                  ? "bg-[#18181b] text-white shadow-xs"
                  : "bg-[#f4f4f5] text-neutral-700 hover:bg-neutral-200/70"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[17px] font-bold text-neutral-900 tracking-tight">
          Chips Collections
        </h2>
        <button
          type="button"
          onClick={onExploreMore}
          className="text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          See all
        </button>
      </div>

      {/* Main Hero Product Card */}
      <div className="bg-white rounded-[28px] p-3.5 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.07)] border border-neutral-100/90 flex flex-col">
        {/* Purple Graphic Box */}
        <div className="w-full bg-[#d7cbfa] rounded-[22px] p-5 relative overflow-hidden aspect-[1/0.92] flex flex-col justify-between">
          {/* Card Top: Title & Favorite Button */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="block text-[28px] font-extrabold text-neutral-900 leading-[1.05] tracking-tight">
                Potato
              </span>
              <span className="block text-[28px] font-extrabold text-neutral-900 leading-[1.05] tracking-tight">
                Chips
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label="Toggle favorite"
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-transform"
            >
              <HeartIcon
                filled={isFavorite}
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? "text-neutral-900" : "text-neutral-400"
                }`}
              />
            </button>
          </div>

          {/* Chips Illustration Image */}
          <div className="absolute inset-0 flex items-center justify-center pt-8 pointer-events-none">
            <div className="relative w-full h-full scale-[1.08] translate-y-2">
              <Image
                src={FEATURED_HERO.image}
                alt={FEATURED_HERO.name}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Card Bottom: Price & Add To Cart Button */}
        <div className="flex items-center justify-between pt-3.5 px-2 pb-1">
          <div>
            <span className="block text-[11px] font-medium text-neutral-400">
              Price
            </span>
            <span className="block text-[18px] font-bold text-neutral-900 tracking-tight">
              {FEATURED_HERO.price}
            </span>
          </div>

          <button
            type="button"
            onClick={onAddToCart}
            className="bg-[#18181b] hover:bg-black text-white text-xs font-semibold px-6 py-3 rounded-full shadow-xs active:scale-95 transition-all"
          >
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  );
}

