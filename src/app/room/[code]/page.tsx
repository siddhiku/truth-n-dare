"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PromptCard } from "@/components/PromptCard";
import { ModeSelector } from "@/components/ModeSelector";
import { AdSlot } from "@/components/AdSlot";
import { ChaosMode, PromptType } from "@/lib/prompts";

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

type RoomPhase = "lobby" | "spinning" | "choosing" | "loading" | "reveal";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className="glass border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2"
    >
      <span className="text-white font-bold tracking-[0.25em] text-sm">{code}</span>
      <span className="text-white/40 text-xs">{copied ? "Copied!" : "Copy"}</span>
    </motion.button>
  );
}

function PlayerAvatar({ player, selected, index, total }: {
  player: Player;
  selected: boolean;
  index: number;
  total: number;
}) {
  const angle = (index / total) * 360 - 90;
  const radius = total <= 4 ? 100 : total <= 6 ? 120 : 140;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
      animate={selected ? {
        scale: [1, 1.15, 1.1],
        filter: ["brightness(1)", "brightness(1.4)", "brightness(1.3)"],
      } : {
        scale: 1,
        filter: "brightness(1)",
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: ["0 0 0px rgba(255,255,255,0.3)", "0 0 30px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.4)"] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
      <motion.div
        className={`
          w-12 h-12 rounded-full flex items-center justify-center text-base font-bold
          border-2 transition-all duration-300
          ${selected
            ? "bg-white text-black border-white shadow-glow"
            : "bg-white/8 text-white/70 border-white/15"
          }
        `}
      >
        {player.name.charAt(0).toUpperCase()}
      </motion.div>
      <span className={`text-xs font-medium max-w-[60px] truncate text-center ${selected ? "text-white" : "text-white/40"}`}>
        {player.name}
      </span>
      {player.isHost && (
        <span className="text-[9px] text-white/25 uppercase tracking-wide">host</span>
      )}
    </motion.div>
  );
}

function BottleArena({
  players,
  selectedIdx,
  onSpin,
  spinning,
  canSpin,
}: {
  players: Player[];
  selectedIdx: number | null;
  onSpin: () => void;
  spinning: boolean;
  canSpin: boolean;
}) {
  const controls = useAnimation();
  const accumulatedRotation = useRef(0);

  useEffect(() => {
    if (spinning) {
      const extra = 5 + Math.floor(Math.random() * 6);
      const base = (selectedIdx !== null && players.length > 0)
        ? (selectedIdx / players.length) * 360
        : Math.random() * 360;
      const total = accumulatedRotation.current + extra * 360 + base;
      accumulatedRotation.current = total;

      controls.start({
        rotate: total,
        transition: {
          duration: 3.5 + Math.random(),
          ease: [0.22, 0.03, 0.1, 1],
        },
      });
    }
  }, [spinning, selectedIdx, players.length, controls]);

  const arenaSize = 340;

  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: arenaSize, height: arenaSize }}
    >
      {/* Arena ring */}
      <div
        className="absolute inset-0 rounded-full border border-white/6"
        style={{ boxShadow: "0 0 60px rgba(255,255,255,0.03)" }}
      />

      {/* Players */}
      {players.map((p, i) => (
        <PlayerAvatar
          key={p.id}
          player={p}
          selected={selectedIdx === i}
          index={i}
          total={players.length}
        />
      ))}

      {/* Bottle */}
      <motion.div animate={controls} className="absolute z-10">
        <svg
          viewBox="0 0 60 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="96"
        >
          {/* Pointer line */}
          <line x1="30" y1="60" x2="30" y2="8" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="30,2 26,10 34,10" fill="white" />
          {/* Bottle base */}
          <ellipse cx="30" cy="78" rx="14" ry="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <rect x="20" y="68" width="20" height="22" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <rect x="24" y="55" width="12" height="18" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Spin button */}
      <motion.button
        onClick={onSpin}
        disabled={!canSpin}
        whileHover={canSpin ? { scale: 1.06 } : {}}
        whileTap={canSpin ? { scale: 0.93 } : {}}
        className={`
          absolute bottom-6 left-1/2 -translate-x-1/2 z-20
          px-7 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase
          transition-all duration-200
          ${canSpin
            ? "bg-white text-black shadow-glow cursor-pointer"
            : "bg-white/10 text-white/30 cursor-not-allowed"
          }
        `}
      >
        {spinning ? "Spinning" : "Spin"}
      </motion.button>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const myName = searchParams.get("name") ?? "You";
  const isHost = searchParams.get("host") === "1";

  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<ChaosMode>("easy");
  const [phase, setPhase] = useState<RoomPhase>("lobby");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [chosenType, setChosenType] = useState<PromptType>("truth");
  const [prompt, setPrompt] = useState("");
  const [addingName, setAddingName] = useState("");
  const [addError, setAddError] = useState("");

  // Init players from sessionStorage (host) or create guest entry
  useEffect(() => {
    const stored = sessionStorage.getItem(`room:${code}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPlayers(data.players ?? []);
        setMode(data.mode ?? "easy");
      } catch {}
    } else {
      // Joining guest — seed with host placeholder + self
      setPlayers([
        { id: "host", name: "Host", isHost: true },
        { id: myName, name: myName },
      ]);
    }
  }, [code, myName]);

  const addPlayer = useCallback(() => {
    const n = addingName.trim();
    if (!n) return;
    if (n.length > 20) { setAddError("Too long"); return; }
    if (players.find((p) => p.name.toLowerCase() === n.toLowerCase())) {
      setAddError("Name taken");
      return;
    }
    setPlayers((ps) => [...ps, { id: `${Date.now()}`, name: n }]);
    setAddingName("");
    setAddError("");
  }, [addingName, players]);

  const removePlayer = useCallback((id: string) => {
    setPlayers((ps) => ps.filter((p) => p.id !== id));
  }, []);

  const startGame = useCallback(() => {
    if (players.length < 2) return;
    setPhase("spinning");
  }, [players]);

  const handleSpin = useCallback(() => {
    if (phase !== "spinning" && phase !== "reveal") return;
    setSelectedIdx(null);
    setPrompt("");

    const idx = Math.floor(Math.random() * players.length);
    setTimeout(() => {
      setSelectedIdx(idx);
      setPhase("choosing");
    }, 4000);

    setPhase("spinning");
  }, [phase, players]);

  const choose = useCallback(async (type: PromptType) => {
    setChosenType(type);
    setPhase("loading");

    try {
      const res = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, mode }),
      });
      const data = await res.json();
      setPrompt(data.text ?? "What's your most embarrassing memory?");
    } catch {
      setPrompt("What's the worst dare you've ever chickened out from?");
    }

    setPhase("reveal");
  }, [mode]);

  const nextRound = useCallback(() => {
    setSelectedIdx(null);
    setPrompt("");
    setPhase("spinning");
  }, []);

  const selectedPlayer = selectedIdx !== null ? players[selectedIdx] : null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Link href="/">
          <span className="text-white/30 text-sm hover:text-white/50 transition-colors">← Leave</span>
        </Link>
        <CopyButton code={code} />
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
          <span className="text-white/40 text-xs">{players.length} players</span>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* LOBBY */}
        <AnimatePresence mode="wait">
          {phase === "lobby" && (
            <motion.div
              key="lobby"
              className="flex-1 flex flex-col items-center px-5 py-8 gap-8 max-w-sm mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight">Game Lobby</h1>
                <p className="text-white/30 text-sm mt-1">Add all players, then start.</p>
              </div>

              {/* Mode (host only) */}
              {isHost && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Chaos Level</p>
                  <ModeSelector value={mode} onChange={setMode} />
                </div>
              )}

              {/* Player list */}
              <div className="w-full flex flex-col gap-2">
                <p className="text-white/40 text-xs uppercase tracking-widest">Players ({players.length})</p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {players.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16, height: 0 }}
                        className="glass rounded-xl px-4 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{p.name}</span>
                          {p.isHost && <span className="text-white/25 text-xs">host</span>}
                        </div>
                        {!p.isHost && players.length > 2 && (
                          <button
                            onClick={() => removePlayer(p.id)}
                            className="text-white/20 hover:text-white/50 transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Add player */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addingName}
                    onChange={(e) => { setAddingName(e.target.value); setAddError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                    placeholder="Add player..."
                    maxLength={20}
                    className="
                      flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                      text-white placeholder:text-white/20 text-sm
                      focus:outline-none focus:border-white/25
                    "
                  />
                  <motion.button
                    onClick={addPlayer}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-medium"
                  >
                    Add
                  </motion.button>
                </div>
                {addError && <p className="text-white/40 text-xs">{addError}</p>}
              </div>

              {/* Start game */}
              <motion.button
                onClick={startGame}
                disabled={players.length < 2}
                whileHover={players.length >= 2 ? { scale: 1.02, y: -2 } : {}}
                whileTap={players.length >= 2 ? { scale: 0.97 } : {}}
                className="
                  w-full bg-white text-black rounded-2xl py-5 font-black text-lg
                  tracking-tight disabled:opacity-30 disabled:cursor-not-allowed
                  shadow-glow hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-shadow
                "
              >
                {players.length < 2 ? "Need 2+ players" : "Start Game →"}
              </motion.button>
            </motion.div>
          )}

          {/* GAME PHASE */}
          {phase !== "lobby" && (
            <motion.div
              key="game"
              className="flex-1 flex flex-col items-center px-5 py-6 gap-6 max-w-lg mx-auto w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Mode badge */}
              <div className="flex items-center gap-2">
                <span className="glass text-white/50 text-xs font-medium tracking-widest uppercase px-3 py-1.5 rounded-full">
                  {mode} mode
                </span>
                <span className="text-white/20 text-xs">{players.length} players</span>
              </div>

              {/* Arena */}
              <AnimatePresence>
                {(phase === "spinning" || phase === "choosing" || phase === "lobby") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <BottleArena
                      players={players}
                      selectedIdx={selectedIdx}
                      onSpin={handleSpin}
                      spinning={phase === "spinning"}
                      canSpin={phase === "spinning" || phase === "reveal"}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chosen player banner */}
              <AnimatePresence>
                {selectedPlayer && phase === "choosing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                    className="text-center"
                  >
                    <motion.p
                      className="text-white/40 text-xs uppercase tracking-widest mb-1"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Spin stopped on
                    </motion.p>
                    <p className="text-3xl font-black text-white">{selectedPlayer.name}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Truth / Dare choice */}
              <AnimatePresence>
                {phase === "choosing" && selectedPlayer && (
                  <motion.div
                    className="w-full flex gap-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.button
                      onClick={() => choose("truth")}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 bg-white text-black rounded-2xl py-5 font-black text-xl tracking-tight shadow-glow"
                    >
                      Truth
                    </motion.button>
                    <motion.button
                      onClick={() => choose("dare")}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className="flex-1 glass border border-white/15 text-white rounded-2xl py-5 font-black text-xl tracking-tight"
                    >
                      Dare
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prompt reveal */}
              <AnimatePresence>
                {(phase === "loading" || phase === "reveal") && (
                  <motion.div
                    className="w-full flex flex-col gap-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Compact arena during reveal */}
                    <AnimatePresence>
                      {selectedPlayer && (
                        <motion.div
                          className="text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <p className="text-white/30 text-xs uppercase tracking-widest">
                            {selectedPlayer.name}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <PromptCard
                      type={chosenType}
                      text={prompt}
                      loading={phase === "loading"}
                      playerName={selectedPlayer?.name}
                    />

                    {phase === "reveal" && (
                      <motion.div
                        className="flex gap-3"
                        initial={{ opacity: 0, y: 10 }}
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
                    {phase === "reveal" && (
                      <AdSlot slot="room-between-rounds" format="rectangle" className="rounded-xl overflow-hidden mt-1" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom sticky ad */}
      <div className="sticky bottom-0 border-t border-white/5 bg-black/90 backdrop-blur-md">
        <AdSlot slot="room-bottom-sticky" format="banner" />
      </div>
    </div>
  );
}
