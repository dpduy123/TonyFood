"use client";

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect(category)}
              className={`shrink-0 select-none rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#0047AB] text-white shadow-xs"
                  : "border border-neutral-200/70 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
