"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rise: number;
}

export function Particles({ count = 18 }: { count?: number }) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 10 + Math.random() * 14,
        delay: Math.random() * 12,
        rise: 900 + Math.random() * 400,
      })),
    [count],
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, bottom: -4 }}
          animate={{ y: [-0, -p.rise], opacity: [0, 0.5, 0.25, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.1, 0.8, 1],
          }}
        />
      ))}
    </div>
  );
}
