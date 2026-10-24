"use client";

import { FilterIcon } from "./icons";
import type { PriceRange } from "../data/snacks";

export default function PriceRangeFilter({
  ranges,
  selectedRange,
  onSelect,
}: {
  ranges: PriceRange[];
  selectedRange: string;
  onSelect: (rangeId: string) => void;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-neutral-200/70 bg-white p-3.5 shadow-2xs">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
        <FilterIcon className="h-3.5 w-3.5" />
        <span>Khoảng giá sản phẩm (VND):</span>
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5">
        {ranges.map((range) => {
          const isActive = selectedRange === range.id;
          return (
            <button
              key={range.id}
              type="button"
              onClick={() => onSelect(range.id)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-neutral-900 font-semibold text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {range.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
