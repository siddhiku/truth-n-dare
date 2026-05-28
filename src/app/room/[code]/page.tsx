"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PromptCard } from "@/components/PromptCard";
import { ModeSelector } from "@/components/ModeSelector";
import { AdSlot } from "@/components/AdSlot";
import { ChaosMode, PromptType } from "@/lib/prompts";
import { getOrCreateUsername, saveUsername } from "@/lib/username";
import { playClick, playBottleSpin, playPlayerSelected, playChoicePick, playCardReveal, playHurray, playNextTurn, playRoomCreated } from "@/lib/sounds";

interface Player {
  id: string;
  name: string;
  isHost?: boolean;
}

type RoomPhase = "lobby" | "spinning" | "choosing" | "loading" | "reveal";

// ─── Copy button ─────────────────────────────────────────────────────────────
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
      <span className="text-white/40 text-xs">{copied ? "✓ Copied" : "Copy"}</span>
    </motion.button>
  );
}

// ─── Player avatar around the ring ───────────────────────────────────────────
function PlayerAvatar({
  player, selected, isCurrentTurn, index, total,
}: {
  player: Player;
  selected: boolean;
  isCurrentTurn: boolean;
  index: number;
  total: number;
}) {
  const angle = (index / total) * 360 - 90;
  const radius = total <= 4 ? 110 : total <= 6 ? 128 : 148;
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
      animate={selected ? { scale: 1.15 } : { scale: 1 }}
      transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Glow ring for selected */}
      {selected && (
        <motion.div
          className="absolute -inset-1 rounded-full"
          animate={{
            boxShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 24px rgba(255,255,255,0.55)",
              "0 0 16px rgba(255,255,255,0.4)",
            ],
          }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        />
      )}

      {/* "Your turn" arrow indicator */}
      {isCurrentTurn && !selected && (
        <motion.div
          className="absolute -top-5 text-white/70 text-xs"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          ▼
        </motion.div>
      )}

      <motion.div
        className={`
          w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
          border-2 transition-colors duration-200
          ${selected
            ? "bg-white text-black border-white"
            : isCurrentTurn
            ? "bg-white/15 text-white border-white/50"
            : "bg-white/6 text-white/60 border-white/12"
          }
        `}
      >
        {player.name.charAt(0).toUpperCase()}
      </motion.div>

      <span
        className={`text-[10px] font-medium max-w-[56px] truncate text-center leading-tight
          ${selected ? "text-white" : isCurrentTurn ? "text-white/80" : "text-white/35"}`}
      >
        {player.name}
      </span>

      {isCurrentTurn && !selected && (
        <span className="text-[9px] text-white/40 uppercase tracking-wide">spin!</span>
      )}
    </motion.div>
  );
}

// ─── Bottle arena ─────────────────────────────────────────────────────────────
function BottleArena({
  players, selectedIdx, onSpin, spinning, canSpin,
}: {
  players: Player[];
  selectedIdx: number | null;
  onSpin: () => void;
  spinning: boolean;
  canSpin: boolean;
  currentTurnIdx: number;
}) {
  const controls = useAnimation();
  const accumulated = useRef(0);

  useEffect(() => {
    if (!spinning) return;
    const finalAngle =
      selectedIdx !== null && players.length > 0
        ? (selectedIdx / players.length) * 360
        : Math.random() * 360;
    const spins = 5 + Math.floor(Math.random() * 6);
    const total = accumulated.current + spins * 360 + finalAngle;
    accumulated.current = total;

    controls.start({
      rotate: total,
      transition: { duration: 3.8 + Math.random() * 0.8, ease: [0.22, 0.03, 0.08, 1] },
    });
  }, [spinning, selectedIdx, players.length, controls]);

  const size = 340;

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      {/* Outer dashed ring */}
      <div className="absolute inset-0 rounded-full border border-dashed border-white/8" />
      {/* Inner glow */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        animate={spinning
          ? { boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 40px rgba(255,255,255,0.12)", "0 0 0px rgba(255,255,255,0)"] }
          : { boxShadow: "0 0 0px rgba(255,255,255,0)" }
        }
        transition={{ duration: 1, repeat: spinning ? Infinity : 0 }}
      />

      {/* Players */}
      {players.map((p, i) => (
        <PlayerAvatar
          key={p.id}
          player={p}
          selected={selectedIdx === i}
          isCurrentTurn={false}  // handled externally — passed via prop below
          index={i}
          total={players.length}
        />
      ))}

      {/* Bottle SVG — clickable */}
      <motion.div
        animate={controls}
        onClick={canSpin ? onSpin : undefined}
        className={`absolute z-10 ${canSpin ? "cursor-pointer" : "cursor-default"}`}
        whileHover={canSpin ? { scale: 1.08 } : {}}
        whileTap={canSpin ? { scale: 0.93 } : {}}
      >
        <svg viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg" width="50" height="104">
          {/* Pointer arrow tip */}
          <line x1="30" y1="62" x2="30" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="30,3 26,12 34,12" fill="white" />
          {/* Bottle body */}
          <rect x="20" y="68" width="20" height="44" rx="5" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
          <rect x="24" y="54" width="12" height="18" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
          {/* Shine */}
          <line x1="24" y1="72" x2="24" y2="104" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Spin prompt label inside arena */}
      {canSpin && !spinning && (
        <motion.p
          className="absolute bottom-6 text-white/35 text-[11px] tracking-widest uppercase select-none"
          animate={{ opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          Tap bottle to spin
        </motion.p>
      )}
      {spinning && (
        <motion.p
          className="absolute bottom-6 text-white/50 text-[11px] tracking-widest uppercase select-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        >
          Spinning…
        </motion.p>
      )}
    </div>
  );
}

// ─── Turn indicator banner ─────────────────────────────────────────────────
function TurnBanner({
  player, isMe, round,
}: { player: Player; isMe: boolean; round: number }) {
  return (
    <motion.div
      key={player.id + round}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-1 text-center"
    >
      <p className="text-white/30 text-xs uppercase tracking-widest">Turn {round}</p>
      <p className="text-xl font-black text-white">
        {isMe ? "Your turn" : `${player.name}'s turn`}
      </p>
      {isMe && (
        <motion.p
          className="text-white/40 text-sm"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Tap the bottle to spin ↑
        </motion.p>
      )}
      {!isMe && (
        <p className="text-white/30 text-sm">Waiting for {player.name} to spin…</p>
      )}
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = (params.code as string).toUpperCase();
  const isHost = searchParams.get("host") === "1";

  // Resolve username: URL param wins on first load, otherwise use cached
  const [myName] = useState<string>(() => {
    const fromUrl = searchParams.get("name");
    if (fromUrl) { saveUsername(fromUrl); return fromUrl; }
    return getOrCreateUsername();
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [mode, setMode] = useState<ChaosMode>("easy");
  const [phase, setPhase] = useState<RoomPhase>("lobby");

  // Turn state: index into `players` array
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0); // host is index 0
  const [round, setRound] = useState(1);

  // Spin result
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [chosenType, setChosenType] = useState<PromptType>("truth");
  const [prompt, setPrompt] = useState("");
  const [addingName, setAddingName] = useState("");
  const [addError, setAddError] = useState("");

  // Init players
  useEffect(() => {
    const stored = sessionStorage.getItem(`room:${code}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPlayers(data.players ?? []);
        setMode(data.mode ?? "easy");
      } catch {}
    } else {
      // Guest joining — seed with host placeholder + self
      setPlayers([
        { id: "host", name: "Host", isHost: true },
        { id: myName, name: myName },
      ]);
    }
  }, [code, myName]);

  // Who am I in the players array?
  const myPlayerIdx = players.findIndex((p) => p.name === myName);
  const isMyTurn = myPlayerIdx !== -1 && myPlayerIdx === currentTurnIdx;
  const currentTurnPlayer = players[currentTurnIdx] ?? players[0];

  const addPlayer = useCallback(() => {
    const n = addingName.trim();
    if (!n) return;
    if (n.length > 20) { setAddError("Too long"); return; }
    if (players.find((p) => p.name.toLowerCase() === n.toLowerCase())) {
      setAddError("Name taken"); return;
    }
    playClick();
    setPlayers((ps) => [...ps, { id: `${Date.now()}`, name: n }]);
    setAddingName("");
    setAddError("");
  }, [addingName, players]);

  const removePlayer = useCallback((id: string) => {
    playClick();
    setPlayers((ps) => ps.filter((p) => p.id !== id));
  }, []);

  const startGame = useCallback(() => {
    if (players.length < 2) return;
    playRoomCreated();
    setCurrentTurnIdx(0);
    setRound(1);
    setPhase("spinning");
  }, [players]);

  const handleSpin = useCallback(() => {
    if (phase !== "spinning") return;
    setSelectedIdx(null);
    setPrompt("");
    playBottleSpin();

    const others = players.map((_, i) => i).filter((i) => i !== currentTurnIdx);
    const pool = others.length > 0 ? others : players.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];

    setTimeout(() => {
      playPlayerSelected();
      setSelectedIdx(idx);
      setPhase("choosing");
    }, 4200);
  }, [phase, players, currentTurnIdx]);

  const choose = useCallback(async (type: PromptType) => {
    playChoicePick();
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

    playCardReveal();
    setPhase("reveal");
  }, [mode]);

  const nextRound = useCallback(() => {
    const nextTurn = (currentTurnIdx + 1) % players.length;
    // Hurray every full cycle (all players had a turn)
    if (nextTurn === 0) {
      playHurray();
    } else {
      playNextTurn();
    }
    setSelectedIdx(null);
    setPrompt("");
    setCurrentTurnIdx(nextTurn);
    setRound((r) => r + 1);
    setPhase("spinning");
  }, [currentTurnIdx, players.length]);

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

        {/* ── LOBBY ── */}
        <AnimatePresence mode="wait">
          {phase === "lobby" && (
            <motion.div
              key="lobby"
              className="flex-1 flex flex-col items-center px-5 py-8 gap-8 max-w-sm mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-center">
                <h1 className="text-2xl font-black text-white tracking-tight">Game Lobby</h1>
                <p className="text-white/30 text-sm mt-1">Add all players, then start.</p>
              </div>

              {/* You badge */}
              <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 self-start">
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                  {myName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium">{myName}</span>
                <span className="text-white/30 text-xs">(you)</span>
              </div>

              {/* Mode (host only) */}
              {isHost && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Chaos Level</p>
                  <ModeSelector value={mode} onChange={(m) => { playClick(); setMode(m); }} />
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
                          {p.isHost && <span className="text-white/25 text-xs">host · spins first</span>}
                        </div>
                        {!p.isHost && players.length > 2 && (
                          <button
                            onClick={() => removePlayer(p.id)}
                            className="text-white/20 hover:text-white/50 transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center"
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
                    placeholder="Add player name..."
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

          {/* ── GAME ── */}
          {phase !== "lobby" && (
            <motion.div
              key="game"
              className="flex-1 flex flex-col items-center px-5 py-5 gap-5 max-w-lg mx-auto w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Mode + round badge */}
              <div className="flex items-center gap-2">
                <span className="glass text-white/40 text-xs font-medium tracking-widest uppercase px-3 py-1.5 rounded-full">
                  {mode}
                </span>
                <span className="text-white/20 text-xs">Round {round}</span>
              </div>

              {/* Turn indicator */}
              <AnimatePresence mode="wait">
                {(phase === "spinning") && currentTurnPlayer && (
                  <TurnBanner
                    key={`turn-${round}`}
                    player={currentTurnPlayer}
                    isMe={isMyTurn}
                    round={round}
                  />
                )}
              </AnimatePresence>

              {/* Arena — show during spinning and choosing */}
              <AnimatePresence>
                {(phase === "spinning" || phase === "choosing") && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    {/* Rebuild PlayerAvatar to carry isCurrentTurn */}
                    <div
                      className="relative flex items-center justify-center mx-auto"
                      style={{ width: 340, height: 340 }}
                    >
                      <div className="absolute inset-0 rounded-full border border-dashed border-white/8" />

                      {players.map((p, i) => {
                        const angle = (i / players.length) * 360 - 90;
                        const radius = players.length <= 4 ? 110 : players.length <= 6 ? 128 : 148;
                        const rad = (angle * Math.PI) / 180;
                        const x = Math.cos(rad) * radius;
                        const y = Math.sin(rad) * radius;
                        const isSelected = selectedIdx === i;
                        const isTurn = i === currentTurnIdx;

                        return (
                          <motion.div
                            key={p.id}
                            className="absolute flex flex-col items-center gap-1"
                            style={{
                              left: "50%", top: "50%",
                              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            }}
                            animate={isSelected ? { scale: 1.18 } : { scale: 1 }}
                            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                          >
                            {isSelected && (
                              <motion.div
                                className="absolute -inset-1 rounded-full"
                                animate={{ boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 28px rgba(255,255,255,0.6)", "0 0 16px rgba(255,255,255,0.4)"] }}
                                transition={{ duration: 0.7, repeat: Infinity, repeatType: "reverse" }}
                              />
                            )}
                            {/* Arrow above current turn player */}
                            {isTurn && phase === "spinning" && !isSelected && (
                              <motion.span
                                className="absolute -top-6 text-white text-xs select-none"
                                animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                              >
                                ▼
                              </motion.span>
                            )}
                            <div
                              className={`
                                w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
                                border-2 transition-colors duration-200
                                ${isSelected
                                  ? "bg-white text-black border-white"
                                  : isTurn && phase === "spinning"
                                  ? "bg-white/15 text-white border-white/50"
                                  : "bg-white/6 text-white/55 border-white/12"
                                }
                              `}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-[10px] max-w-[56px] truncate text-center ${isSelected ? "text-white font-semibold" : isTurn ? "text-white/70" : "text-white/35"}`}>
                              {p.name}
                            </span>
                          </motion.div>
                        );
                      })}

                      {/* Spinning bottle */}
                      <BottleArena
                        players={players}
                        selectedIdx={selectedIdx}
                        onSpin={handleSpin}
                        spinning={phase === "spinning"}
                        canSpin={phase === "spinning" && isMyTurn}
                        currentTurnIdx={currentTurnIdx}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected player reveal */}
              <AnimatePresence>
                {selectedPlayer && phase === "choosing" && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Bottle landed on</p>
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
                    className="w-full flex flex-col gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {selectedPlayer && (
                      <p className="text-white/30 text-xs uppercase tracking-widest text-center">
                        {selectedPlayer.name}
                      </p>
                    )}

                    <PromptCard
                      type={chosenType}
                      text={prompt}
                      loading={phase === "loading"}
                      playerName={selectedPlayer?.name}
                    />

                    {phase === "reveal" && (
                      <>
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
                            Next Turn →
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

                        {/* Next spinner preview */}
                        {players.length > 1 && (
                          <motion.div
                            className="glass rounded-xl px-4 py-3 flex items-center gap-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <span className="text-white/25 text-xs">Next to spin →</span>
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                              {players[(currentTurnIdx + 1) % players.length]?.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white/60 text-sm font-medium">
                              {players[(currentTurnIdx + 1) % players.length]?.name}
                            </span>
                          </motion.div>
                        )}

                        <AdSlot slot="room-between-rounds" format="rectangle" className="rounded-xl overflow-hidden mt-1" />
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky bottom ad */}
      <div className="sticky bottom-0 border-t border-white/5 bg-black/90 backdrop-blur-md">
        <AdSlot slot="room-bottom-sticky" format="banner" />
      </div>
    </div>
  );
}
