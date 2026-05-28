"use client";

import { motion } from "framer-motion";
import { ChaosMode } from "@/lib/prompts";

interface ModeSelectorProps {
  value: ChaosMode;
  onChange: (mode: ChaosMode) => void;
}

const modes: { id: ChaosMode; label: string; sub: string }[] = [
  { id: "easy", label: "Easy", sub: "Funny & harmless" },
  { id: "crispy", label: "Crispy", sub: "Awkward pressure" },
  { id: "ruthless", label: "Ruthless", sub: "No mercy" },
];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-2 w-full">
      {modes.map((mode) => {
        const active = value === mode.id;
        return (
          <motion.button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`
              flex-1 relative rounded-xl px-3 py-3 text-center transition-colors duration-200
              ${active
                ? "bg-white text-black"
                : "bg-white/5 border border-white/8 text-white/60 hover:bg-white/8"
              }
            `}
          >
            {active && (
              <motion.div
                layoutId="mode-bg"
                className="absolute inset-0 rounded-xl bg-white"
                style={{ zIndex: -1 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <p className={`text-sm font-semibold ${active ? "text-black" : "text-white"}`}>
              {mode.label}
            </p>
            <p className={`text-xs mt-0.5 ${active ? "text-black/60" : "text-white/30"}`}>
              {mode.sub}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
