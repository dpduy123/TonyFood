"use client";

import { SearchIcon } from "./icons";

export default function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative mb-4">
      <div className="flex w-full items-center gap-3 rounded-full border border-neutral-200/80 bg-white px-4 py-3.5 shadow-2xs transition-all focus-within:ring-2 focus-within:ring-blue-400">
        <SearchIcon className="ml-1 h-4 w-4 shrink-0 text-neutral-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-2 text-xs text-neutral-400 hover:text-neutral-600"
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
}
