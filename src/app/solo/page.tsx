"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Bottle } from "@/components/Bottle";
import { ModeSelector } from "@/components/ModeSelector";
import { PromptCard } from "@/components/PromptCard";
import { AdSlot } from "@/components/AdSlot";
import { ChaosMode, PromptType } from "@/lib/prompts";
import { playClick, playChoicePick, playCardReveal, playHurray, playNextTurn } from "@/lib/sounds";

type GameState = "idle" | "spinning" | "choosing" | "loading" | "reveal" | "done";

interface Stats {
  rounds: number;
  truths: number;
  dares: number;
  streak: number;
}

export default function SoloPage() {
  const [mode, setMode] = useState<ChaosMode>("easy");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [chosenType, setChosenType] = useState<PromptType>("truth");
  const [prompt, setPrompt] = useState("");
  const [stats, setStats] = useState<Stats>({ rounds: 0, truths: 0, dares: 0, streak: 0 });

  const handleSpinEnd = useCallback(() => {
    setGameState("choosing");
  }, []);

  const choose = useCallback(async (type: PromptType) => {
    playChoicePick();
    setChosenType(type);
    setGameState("loading");

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mode }),
      });
      const data = await res.json();
      setPrompt(data.text ?? "Tell everyone your most embarrassing moment.");
    } catch {
      setPrompt("What's the last white lie you told today?");
    }

    playCardReveal();
    setGameState("reveal");
  }, [mode]);

  const nextRound = useCallback(() => {
    const newRounds = stats.rounds + 1;
    if (newRounds % 5 === 0) {
      playHurray();
    } else {
      playNextTurn();
    }
    setStats((s) => ({
      rounds: s.rounds + 1,
      truths: s.truths + (chosenType === "truth" ? 1 : 0),
      dares: s.dares + (chosenType === "dare" ? 1 : 0),
      streak: s.streak + 1,
    }));
    setGameState("idle");
    setPrompt("");
  }, [chosenType, stats.rounds]);

  const reset = useCallback(() => {
    setStats({ rounds: 0, truths: 0, dares: 0, streak: 0 });
    setGameState("idle");
    setPrompt("");
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-6 py-5 border-b border-white/5"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/">
          <motion.span
            whileHover={{ opacity: 0.7 }}
            className="text-white/40 text-sm tracking-wide flex items-center gap-2 cursor-pointer"
          >
            ← Back
          </motion.span>
        </Link>
        <span className="text-white/60 text-sm font-medium">Solo Mode</span>
        {stats.rounds > 0 && (
          <button onClick={reset} className="text-white/30 text-xs hover:text-white/60 transition-colors">
            Reset
          </button>
        )}
        {stats.rounds === 0 && <div className="w-12" />}
      </motion.header>

      {/* Stats bar */}
      <AnimatePresence>
        {stats.rounds > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-6 px-6 py-3 border-b border-white/5"
          >
            {[
              { label: "Rounds", value: stats.rounds },
              { label: "Truths", value: stats.truths },
              { label: "Dares", value: stats.dares },
              { label: "Streak", value: `🔥 ${stats.streak}` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8 max-w-lg mx-auto w-full">

        {/* Mode selector */}
        <AnimatePresence>
          {(gameState === "idle" || gameState === "spinning") && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-white/30 text-xs uppercase tracking-widest text-center mb-3">Chaos Level</p>
              <ModeSelector value={mode} onChange={(m) => { playClick(); setMode(m); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottle */}
        <AnimatePresence>
          {(gameState === "idle" || gameState === "spinning") && (
            <motion.div
              className="flex flex-col items-center gap-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
            >
              <Bottle
                onSpinEnd={handleSpinEnd}
                disabled={gameState === "spinning"}
                size={220}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Truth / Dare choice */}
        <AnimatePresence>
          {gameState === "choosing" && (
            <motion.div
              className="w-full flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.p
                className="text-white/50 text-sm tracking-widest uppercase"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Choose your fate
              </motion.p>
              <div className="flex gap-4 w-full">
                <motion.button
                  onClick={() => choose("truth")}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 bg-white text-black rounded-2xl py-6 font-black text-2xl tracking-tight shadow-glow"
                >
                  Truth
                </motion.button>
                <motion.button
                  onClick={() => choose("dare")}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 glass border border-white/15 text-white rounded-2xl py-6 font-black text-2xl tracking-tight"
                >
                  Dare
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt reveal */}
        <AnimatePresence>
          {(gameState === "loading" || gameState === "reveal") && (
            <motion.div
              className="w-full flex flex-col gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PromptCard
                type={chosenType}
                text={prompt}
                loading={gameState === "loading"}
              />

              {gameState === "reveal" && (
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    onClick={nextRound}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 bg-white text-black rounded-xl py-4 font-bold text-sm tracking-wide"
                  >
                    Next Round →
                  </motion.button>
                  <motion.button
                    onClick={() => choose(chosenType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="glass border border-white/10 text-white/60 rounded-xl px-5 py-4 text-sm"
                  >
                    Reroll
                  </motion.button>
                </motion.div>
              )}

              {/* Ad between rounds */}
              {gameState === "reveal" && (
                <AdSlot slot="solo-between-rounds" format="rectangle" className="mt-2 rounded-xl overflow-hidden" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Bottom sticky ad */}
      <div className="sticky bottom-0 border-t border-white/5 bg-black/90 backdrop-blur-md">
        <AdSlot slot="solo-bottom-sticky" format="banner" />
      </div>
    </div>
  );
}
