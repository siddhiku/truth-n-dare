"use client";

import { motion, useAnimation } from "framer-motion";
import { useCallback, useState } from "react";
import { playBottleSpin, playPlayerSelected } from "@/lib/sounds";

interface BottleProps {
  onSpinEnd?: (angle: number) => void;
  disabled?: boolean;
  size?: number;
}

export function Bottle({ onSpinEnd, disabled, size = 180 }: BottleProps) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);

  const spin = useCallback(async () => {
    if (spinning || disabled) return;
    setSpinning(true);
    playBottleSpin();

    const extraSpins = 5 + Math.floor(Math.random() * 8);
    const finalAngle = Math.random() * 360;
    const totalRotation = extraSpins * 360 + finalAngle;

    await controls.start({
      rotate: [0, totalRotation * 0.3, totalRotation * 0.7, totalRotation * 0.9, totalRotation],
      transition: {
        duration: 3 + Math.random() * 1.5,
        ease: [0.25, 0.1, 0.1, 1],
        times: [0, 0.3, 0.6, 0.85, 1],
      },
    });

    playPlayerSelected();
    onSpinEnd?.(finalAngle);
    setSpinning(false);
  }, [spinning, disabled, controls, onSpinEnd]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={spinning ? {
          boxShadow: [
            "0 0 20px rgba(255,255,255,0.05)",
            "0 0 60px rgba(255,255,255,0.2)",
            "0 0 20px rgba(255,255,255,0.05)",
          ],
        } : {
          boxShadow: "0 0 30px rgba(255,255,255,0.06)",
        }}
        transition={{ duration: 1.2, repeat: spinning ? Infinity : 0 }}
      />

      {/* Bottle SVG */}
      <motion.div
        animate={controls}
        className="cursor-pointer select-none"
        onClick={spin}
        whileHover={!spinning && !disabled ? { scale: 1.05 } : {}}
        whileTap={!spinning && !disabled ? { scale: 0.97 } : {}}
        style={{ width: size * 0.7, height: size * 0.7 }}
      >
        <svg
          viewBox="0 0 100 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Bottle body */}
          <rect
            x="30" y="55"
            width="40" height="85"
            rx="6"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          {/* Bottle neck */}
          <rect
            x="39" y="25"
            width="22" height="32"
            rx="3"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />
          {/* Bottle cap */}
          <rect
            x="37" y="15"
            width="26" height="14"
            rx="4"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
          {/* Label */}
          <rect
            x="35" y="75"
            width="30" height="40"
            rx="3"
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
          {/* Shine */}
          <line
            x1="38" y1="60"
            x2="38" y2="130"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Tap hint */}
      {!spinning && !disabled && (
        <motion.p
          className="absolute -bottom-8 text-xs text-white/30 tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tap to spin
        </motion.p>
      )}

      {spinning && (
        <motion.p
          className="absolute -bottom-8 text-xs text-white/50 tracking-widest uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          Spinning...
        </motion.p>
      )}
    </div>
  );
}
