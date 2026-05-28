"use client";

import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModeSelector } from "@/components/ModeSelector";
import { ChaosMode } from "@/lib/prompts";
import { getOrCreateUsername, saveUsername } from "@/lib/username";
import { playClick, playRoomCreated } from "@/lib/sounds";

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

  // Pre-fill with cached username
  useEffect(() => {
    setName(getOrCreateUsername());
  }, []);

  const handleCreate = useCallback(() => {
    const n = name.trim();
    if (!n) { setError("Enter your name first"); return; }
    if (n.length > 20) { setError("Name too long (max 20 chars)"); return; }

    saveUsername(n);
    playRoomCreated();
    setLoading(true);

    const code = generateCode();
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
        <Link href="/">
          <span className="text-white/30 text-sm hover:text-white/60 transition-colors">← Back</span>
        </Link>

        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Room</h1>
          <p className="text-white/30 text-sm mt-1">Share the code with friends to play together.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Your Name</label>
          <div className="relative">
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
                transition-all duration-200 pr-24
              "
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs pointer-events-none">
              auto-saved
            </span>
          </div>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-white/50 text-xs">
              {error}
            </motion.p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Chaos Level</label>
          <ModeSelector value={mode} onChange={(m) => { playClick(); setMode(m); }} />
        </div>

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
