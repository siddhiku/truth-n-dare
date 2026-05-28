"use client";

import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = useCallback(() => {
    const n = name.trim();
    const c = code.trim().toUpperCase();

    if (!n) { setError("Enter your name first"); return; }
    if (c.length !== 6) { setError("Room code must be 6 characters"); return; }
    if (n.length > 20) { setError("Name too long (max 20 chars)"); return; }

    setLoading(true);
    router.push(`/room/${c}?name=${encodeURIComponent(n)}`);
  }, [name, code, router]);

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
          <h1 className="text-3xl font-black text-white tracking-tight">Join Room</h1>
          <p className="text-white/30 text-sm mt-1">Enter the 6-character code from your host.</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Enter your name..."
            maxLength={20}
            className="
              w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4
              text-white placeholder:text-white/20 text-base
              focus:outline-none focus:border-white/30 focus:bg-white/8
              transition-all duration-200
            "
          />
        </div>

        {/* Code input */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-xs uppercase tracking-widest">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 6)); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            className="
              w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4
              text-white placeholder:text-white/20 text-2xl font-bold tracking-[0.3em] text-center uppercase
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

        {/* Code character boxes */}
        <div className="flex gap-2 justify-center">
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={i}
              className={`
                w-10 h-12 rounded-lg flex items-center justify-center text-lg font-bold
                border transition-all duration-150
                ${code[i]
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-white/3 border-white/8 text-white/10"
                }
              `}
              animate={code[i] ? { scale: [1.1, 1] } : {}}
              transition={{ duration: 0.15 }}
            >
              {code[i] || "·"}
            </motion.div>
          ))}
        </div>

        {/* Join button */}
        <motion.button
          onClick={handleJoin}
          disabled={loading || code.length < 6 || !name.trim()}
          whileHover={!loading ? { scale: 1.02, y: -2 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="
            w-full bg-white text-black rounded-2xl py-5 font-black text-lg
            tracking-tight shadow-glow disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]
          "
        >
          {loading ? "Joining..." : "Join Room →"}
        </motion.button>

        <p className="text-center text-white/20 text-xs">
          No room yet?{" "}
          <Link href="/room/create" className="text-white/50 hover:text-white underline underline-offset-2">
            Create Room
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
