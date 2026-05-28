"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeSelector } from "@/components/ModeSelector";
import { ChaosMode } from "@/lib/prompts";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ChaosMode>("easy");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = useCallback(() => {
    const n = name.trim();
    if (!n) { setError("Enter your name first"); return; }
    if (n.length > 20) { setError("Name too long (max 20 chars)"); return; }
    setLoading(true);

    const code = generateCode();
    // Store host info in sessionStorage so the room page can initialise
    sessionStorage.setItem(`room:${code}`, JSON.stringify({
      host: n,
      mode,
      players: [{ id: "host", name: n, isHost: true }],
      createdAt: Date.now(),
    }));

    router.push(`/room/${code}?name=${encodeURIComponent(n)}&host=1`);
  }, [name, mode, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <motion.div
        className="w-full max-w-sm flex flex-col gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back */}
        <Link href="/">
          <span className="text-white/30 text-sm hover:text-white/60 transition-colors flex items-center gap-1">
            ← Back
          </span>
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Room</h1>
          <p className="text-white/30 text-sm mt-1">Share the code with friends to play together.</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Enter your name..."
            maxLength={20}
            className="
              w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4
              text-white placeholder:text-white/20 text-base
              focus:outline-none focus:border-white/30 focus:bg-white/8
              transition-all duration-200
            "
          />
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/50 text-xs"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Chaos Level</label>
          <ModeSelector value={mode} onChange={setMode} />
        </div>

        {/* Create button */}
        <motion.button
          onClick={handleCreate}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="
            w-full bg-white text-black rounded-2xl py-5 font-black text-lg
            tracking-tight shadow-glow disabled:opacity-50 disabled:cursor-not-allowed
            transition-shadow duration-200 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]
          "
        >
          {loading ? "Creating..." : "Create Room →"}
        </motion.button>

        <p className="text-center text-white/20 text-xs">
          Already have a code?{" "}
          <Link href="/room/join" className="text-white/50 hover:text-white underline underline-offset-2">
            Join Room
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
