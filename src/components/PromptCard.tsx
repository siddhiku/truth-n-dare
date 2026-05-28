"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PromptType } from "@/lib/prompts";

interface PromptCardProps {
  type: PromptType;
  text: string;
  loading?: boolean;
  playerName?: string;
}

export function PromptCard({ type, text, loading, playerName }: PromptCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ rotateY: 90, scale: 0.85, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        exit={{ rotateY: -90, scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ perspective: 1000 }}
        className="w-full"
      >
        <div className="glass-strong rounded-2xl p-6 relative overflow-hidden">
          {/* Background type indicator */}
          <div
            className={`
              absolute inset-0 opacity-5 pointer-events-none
              ${type === "truth" ? "bg-gradient-to-br from-white to-transparent" : "bg-gradient-to-tl from-white to-transparent"}
            `}
          />

          {/* Type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase
                ${type === "truth"
                  ? "bg-white text-black"
                  : "bg-white/10 border border-white/20 text-white"
                }
              `}
            >
              {type}
            </span>
            {playerName && (
              <span className="text-white/40 text-sm">for {playerName}</span>
            )}
          </div>

          {/* Prompt text */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {[100, 80, 60].map((w, i) => (
                  <motion.div
                    key={i}
                    className="h-4 rounded-full bg-white/10"
                    style={{ width: `${w}%` }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.p
                key="text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-lg font-medium text-white leading-snug"
              >
                {text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
