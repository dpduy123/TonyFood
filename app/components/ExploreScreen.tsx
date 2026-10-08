"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SearchIcon, CheckIcon, PlusIcon } from "./icons";
import { EXPLORE_COLLECTIONS, EXPLORE_FILTERS } from "../data/snacks";

interface ExploreScreenProps {
  onSelectCollection?: (id: string) => void;
}

export function ExploreScreen({ onSelectCollection }: ExploreScreenProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 overflow-y-auto no-scrollbar">
      {/* Header: Explore Collections & Search Button */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-neutral-900 leading-[1.08]">
            Explore
            <br />
            Collections
          </h1>
        </div>
        <button
          type="button"
          aria-label="Search"
          className="w-11 h-11 rounded-full bg-[#f4f4f5] flex items-center justify-center text-neutral-800 hover:bg-neutral-200 transition-colors shrink-0 shadow-2xs mt-1"
        >
          <SearchIcon className="w-4 h-4 text-neutral-800" />
        </button>
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
        {EXPLORE_FILTERS.map((f) => {
          const isSelected = activeFilter === f.id;

          if (f.id === "all") {
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`pl-4 pr-1.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#f4f4f5] text-neutral-900 ring-1 ring-neutral-300"
                    : "bg-[#f4f4f5] text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <span>All</span>
                <span className="w-6 h-6 rounded-full bg-[#18181b] text-white flex items-center justify-center">
                  <CheckIcon className="w-3 h-3" />
                </span>
              </button>
            );
          }

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all ${
                isSelected
                  ? "bg-[#18181b] text-white font-semibold"
                  : "bg-[#f4f4f5] text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <span>{f.label}</span>
              {f.hasPlus && <PlusIcon className="w-3 h-3" />}
            </button>
          );
        })}
      </div>

      {/* Vertical List of Collection Cards */}
      <div className="flex flex-col gap-4">
        {EXPLORE_COLLECTIONS.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectCollection?.(item.id)}
            style={{ backgroundColor: item.bgColor }}
            className="rounded-[26px] p-5 relative overflow-hidden flex items-center justify-between min-h-[140px] cursor-pointer hover:shadow-xs active:scale-[0.99] transition-all group"
          >
            {/* Card Left Info */}
            <div className="relative z-10 max-w-[55%] flex flex-col justify-center">
              <h3 className="text-[17px] font-bold text-neutral-900 tracking-tight leading-snug">
                {item.name}
              </h3>
              <p className="text-xs text-neutral-500 font-normal mt-1">
                {item.subtitle}
              </p>
            </div>

            {/* Card Right Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[55%] flex items-center justify-end overflow-hidden pointer-events-none">
              <div className="relative w-full h-full scale-[1.08] translate-x-1 group-hover:scale-[1.12] transition-transform duration-300">
                <Image
                  src={item.cardImage || item.image}
                  alt={item.name}
                  fill
                  className="object-cover object-right"
                  priority
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

