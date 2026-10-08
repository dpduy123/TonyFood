"use client";

import React from "react";
import { SignalIcon, WifiIcon, BatteryIcon } from "./icons";

export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-7 pt-3 pb-2 text-neutral-900 select-none">
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalIcon className="w-4 h-4" />
        <WifiIcon className="w-4 h-4" />
        <BatteryIcon className="w-5 h-5 ml-0.5" />
      </div>
    </div>
  );
}

