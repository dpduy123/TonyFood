"use client";

import React from "react";
import { HomeIcon, CompassIcon, CartIcon, HeartIcon } from "./icons";

export type TabType = "home" | "explore" | "cart" | "favorite";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home" as TabType, label: "Home", icon: HomeIcon },
    { id: "explore" as TabType, label: "Explore", icon: CompassIcon },
    { id: "cart" as TabType, label: "Cart", icon: CartIcon },
    { id: "favorite" as TabType, label: "Favorite", icon: HeartIcon },
  ];

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md border-t border-neutral-100 px-6 py-3 flex items-center justify-between select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center gap-1 transition-all group"
          >
            <div
              className={`transition-colors duration-200 ${
                isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600"
              }`}
            >
              <Icon filled={isActive} className="w-[22px] h-[22px]" />
            </div>
            <span
              className={`text-[11px] transition-colors duration-200 ${
                isActive
                  ? "font-semibold text-neutral-900"
                  : "font-normal text-neutral-400 group-hover:text-neutral-600"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

