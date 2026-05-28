"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PromptCard } from "@/components/PromptCard";
import { ModeSelector } from "@/components/ModeSelector";
import { AdSlot } from "@/components/AdSlot";
import { ChatPanel } from "@/components/ChatPanel";
import { getOrCreateUsername, saveUsername } from "@/lib/username";
import { useRoomSocket } from "@/lib/useRoomSocket";
import { SPIN_DURATION_MS } from "@/lib/realtime";
import type { PlayerState } from "@/lib/realtime";
import {
  playClick,
  playBottleSpin,
  playPlayerSelected,
  playChoicePick,
  playCardReveal,
  playHurray,
  playNextTurn,
  playRoomCreated,
} from "@/lib/sounds";

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

// ─── Spinning bottle (animation only; landing target comes from server) ──────
function SpinningBottle({
  spinning, onSpin, canSpin, landingRotation,
}: {
  spinning: boolean;
  onSpin: () => void;
  canSpin: boolean;
  /** Absolute rotation (deg) to land on; null while idle. */
  landingRotation: number | null;
}) {
  const controls = useAnimation();
  const accumulated = useRef(0);

  useEffect(() => {
    if (!spinning || landingRotation === null) return;
    const spins = 5 + Math.floor(Math.random() * 4);
    const total = accumulated.current + spins * 360 + landingRotation;
    accumulated.current = total;
    controls.start({
      rotate: total,
      transition: { duration: SPIN_DURATION_MS / 1000, ease: [0.22, 0.03, 0.08, 1] },
    });
  }, [spinning, landingRotation, controls]);

  return (
    <motion.div
      animate={controls}
      onClick={canSpin ? onSpin : undefined}
      className={`absolute z-10 ${canSpin ? "cursor-pointer" : "cursor-default"}`}
      whileHover={canSpin ? { scale: 1.08 } : {}}
      whileTap={canSpin ? { scale: 0.93 } : {}}
    >
      <svg viewBox="0 0 60 130" fill="none" xmlns="http://www.w3.org/2000/svg" width="50" height="104">
        <line x1="30" y1="62" x2="30" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="30,3 26,12 34,12" fill="white" />
        <rect x="20" y="68" width="20" height="44" rx="5" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        <rect x="24" y="54" width="12" height="18" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" />
        <line x1="24" y1="72" x2="24" y2="104" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

// ─── Turn indicator banner ─────────────────────────────────────────────────
function TurnBanner({ player, isMe, round }: { player: PlayerState; isMe: boolean; round: number }) {
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
      <p className="text-xl font-black text-white">{isMe ? "Your turn" : `${player.name}'s turn`}</p>
      {isMe ? (
        <motion.p className="text-white/40 text-sm" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
          Tap the bottle to spin ↑
        </motion.p>
      ) : (
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

  const [myName] = useState<string>(() => {
    const fromUrl = searchParams.get("name");
    if (fromUrl) { saveUsername(fromUrl); return fromUrl; }
    return getOrCreateUsername();
  });

  const room = useRoomSocket(code, myName);
  const state = room.state;

  // The creator passes ?mode= from the create screen. Once connected as host
  // in the lobby, push it to the server one time so all players see it.
  const desiredMode = searchParams.get("mode");
  const appliedMode = useRef(false);

  // Local spin-animation lifecycle, driven by the server's spinSignal nonce.
  const [animating, setAnimating] = useState(false);
  const lastNonce = useRef(0);

  // When a new authoritative spin arrives, play the local landing animation.
  useEffect(() => {
    const sig = room.spinSignal;
    if (!sig || sig.nonce === lastNonce.current) return;
    lastNonce.current = sig.nonce;
    setAnimating(true);
    playBottleSpin();
    const t = setTimeout(() => {
      playPlayerSelected();
      setAnimating(false);
    }, SPIN_DURATION_MS);
    return () => clearTimeout(t);
  }, [room.spinSignal]);

  // Sound cues on phase transitions from the server.
  const prevPhase = useRef<string | null>(null);
  useEffect(() => {
    if (!state) return;
    if (prevPhase.current && prevPhase.current !== state.phase) {
      if (state.phase === "reveal") playCardReveal();
      if (state.phase === "spinning" && prevPhase.current === "reveal") {
        state.round % state.players.length === 1 ? playHurray() : playNextTurn();
      }
    }
    prevPhase.current = state.phase;
  }, [state]);

  // Host applies the mode chosen on the create screen, once.
  useEffect(() => {
    if (appliedMode.current || !state || state.phase !== "lobby") return;
    const me = state.players.find((p) => p.name === myName);
    if (!me?.isHost) return;
    if (
      (desiredMode === "easy" || desiredMode === "crispy" || desiredMode === "ruthless") &&
      desiredMode !== state.mode
    ) {
      room.setMode(desiredMode);
    }
    appliedMode.current = true;
  }, [state, desiredMode, myName, room]);

  if (!state) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-5 px-6 text-center">
        {room.error ? (
          <>
            <div className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-white/50 text-xl">!</div>
            <p className="text-white/70 text-base font-medium max-w-xs">{room.error}</p>
            <div className="flex gap-3">
              <Link href="/room/join" className="glass border border-white/10 rounded-xl px-4 py-2.5 text-white/70 text-sm">Try again</Link>
              <Link href="/" className="text-white/40 text-sm px-4 py-2.5">Home</Link>
            </div>
          </>
        ) : (
          <>
            <motion.div
              className="w-3 h-3 rounded-full bg-white"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <p className="text-white/40 text-sm">{room.connected ? "Joining room…" : "Connecting…"}</p>
          </>
        )}
      </div>
    );
  }

  const me = state.players.find((p) => p.name === myName);
  const iAmHost = !!me?.isHost;
  const isMyTurn = me?.id === state.currentTurnId;
  const currentTurnPlayer = state.players.find((p) => p.id === state.currentTurnId) ?? state.players[0];
  const selectedPlayer = state.selectedId ? state.players.find((p) => p.id === state.selectedId) ?? null : null;
  const connectedCount = state.players.filter((p) => p.connected).length;

  // Where the bottle should point, given the selected player's seat.
  const landingRotation =
    state.selectedId !== null
      ? (state.players.findIndex((p) => p.id === state.selectedId) / state.players.length) * 360
      : null;

  // The choice UI shows once the local landing animation finishes. On a fresh
  // reconnect mid-round there's no in-flight animation, so reveal immediately.
  const showChoosing = state.phase === "choosing" && !animating;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <motion.header
        className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Link href="/"><span className="text-white/30 text-sm hover:text-white/50 transition-colors">← Leave</span></Link>
        <CopyButton code={code} />
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${room.connected ? "bg-white/40 animate-pulse" : "bg-white/15"}`} />
          <span className="text-white/40 text-xs">{connectedCount} online</span>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ── LOBBY ── */}
          {state.phase === "lobby" && (
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
                <p className="text-white/30 text-sm mt-1">Share the code. Players appear live.</p>
              </div>

              <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 self-start">
                <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                  {myName.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium">{myName}</span>
                <span className="text-white/30 text-xs">(you{iAmHost ? " · host" : ""})</span>
              </div>

              {iAmHost && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest">Chaos Level</p>
                  <ModeSelector value={state.mode} onChange={(m) => { playClick(); room.setMode(m); }} />
                </div>
              )}

              <div className="w-full flex flex-col gap-2">
                <p className="text-white/40 text-xs uppercase tracking-widest">Players ({connectedCount})</p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {state.players.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: p.connected ? 1 : 0.4, x: 0 }}
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
                        <span className={`text-xs ${p.connected ? "text-white/30" : "text-white/20"}`}>
                          {p.connected ? "online" : "offline"}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {iAmHost ? (
                <motion.button
                  onClick={() => { playRoomCreated(); room.start(); }}
                  disabled={connectedCount < 2}
                  whileHover={connectedCount >= 2 ? { scale: 1.02, y: -2 } : {}}
                  whileTap={connectedCount >= 2 ? { scale: 0.97 } : {}}
                  className="w-full bg-white text-black rounded-2xl py-5 font-black text-lg tracking-tight disabled:opacity-30 disabled:cursor-not-allowed shadow-glow hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-shadow"
                >
                  {connectedCount < 2 ? "Need 2+ players" : "Start Game →"}
                </motion.button>
              ) : (
                <div className="w-full text-center glass rounded-2xl py-5">
                  <p className="text-white/50 text-sm">Waiting for host to start…</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── GAME ── */}
          {state.phase !== "lobby" && (
            <motion.div
              key="game"
              className="flex-1 flex flex-col items-center px-5 py-5 gap-5 max-w-lg mx-auto w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <span className="glass text-white/40 text-xs font-medium tracking-widest uppercase px-3 py-1.5 rounded-full">{state.mode}</span>
                <span className="text-white/20 text-xs">Round {state.round}</span>
              </div>

              <AnimatePresence mode="wait">
                {state.phase === "spinning" && !animating && currentTurnPlayer && (
                  <TurnBanner key={`turn-${state.round}`} player={currentTurnPlayer} isMe={isMyTurn} round={state.round} />
                )}
              </AnimatePresence>

              {/* Arena */}
              <AnimatePresence>
                {(state.phase === "spinning" || (state.phase === "choosing")) && (
                  <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <div className="relative flex items-center justify-center mx-auto" style={{ width: 340, height: 340 }}>
                      <div className="absolute inset-0 rounded-full border border-dashed border-white/8" />

                      {state.players.map((p, i) => {
                        const angle = (i / state.players.length) * 360 - 90;
                        const radius = state.players.length <= 4 ? 110 : state.players.length <= 6 ? 128 : 148;
                        const rad = (angle * Math.PI) / 180;
                        const x = Math.cos(rad) * radius;
                        const y = Math.sin(rad) * radius;
                        const isSelected = state.selectedId === p.id && !animating;
                        const isTurn = p.id === state.currentTurnId;

                        return (
                          <motion.div
                            key={p.id}
                            className="absolute flex flex-col items-center gap-1"
                            style={{ left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
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
                            {isTurn && state.phase === "spinning" && !isSelected && (
                              <motion.span className="absolute -top-6 text-white text-xs select-none" animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }}>▼</motion.span>
                            )}
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-200 ${isSelected ? "bg-white text-black border-white" : isTurn && state.phase === "spinning" ? "bg-white/15 text-white border-white/50" : p.connected ? "bg-white/6 text-white/55 border-white/12" : "bg-white/3 text-white/25 border-white/8"}`}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-[10px] max-w-[56px] truncate text-center ${isSelected ? "text-white font-semibold" : isTurn ? "text-white/70" : "text-white/35"}`}>{p.name}</span>
                          </motion.div>
                        );
                      })}

                      <SpinningBottle
                        spinning={animating}
                        onSpin={() => room.spin()}
                        canSpin={state.phase === "spinning" && isMyTurn && !animating}
                        landingRotation={landingRotation}
                      />

                      {state.phase === "spinning" && isMyTurn && !animating && (
                        <motion.p className="absolute bottom-6 text-white/35 text-[11px] tracking-widest uppercase select-none" animate={{ opacity: [0.35, 0.8, 0.35] }} transition={{ duration: 2.4, repeat: Infinity }}>Tap bottle to spin</motion.p>
                      )}
                      {animating && (
                        <motion.p className="absolute bottom-6 text-white/50 text-[11px] tracking-widest uppercase select-none" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.7, repeat: Infinity }}>Spinning…</motion.p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selected reveal */}
              <AnimatePresence>
                {selectedPlayer && showChoosing && (
                  <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Bottle landed on</p>
                    <p className="text-3xl font-black text-white">{selectedPlayer.name}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Truth / Dare choice — only the selected player chooses */}
              <AnimatePresence>
                {showChoosing && selectedPlayer && (
                  <motion.div className="w-full flex flex-col gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.2 }}>
                    {selectedPlayer.id === me?.id ? (
                      <div className="flex gap-4">
                        <motion.button onClick={() => { playChoicePick(); room.choose("truth"); }} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }} className="flex-1 bg-white text-black rounded-2xl py-5 font-black text-xl tracking-tight shadow-glow">Truth</motion.button>
                        <motion.button onClick={() => { playChoicePick(); room.choose("dare"); }} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.96 }} className="flex-1 glass border border-white/15 text-white rounded-2xl py-5 font-black text-xl tracking-tight">Dare</motion.button>
                      </div>
                    ) : (
                      <p className="text-center text-white/40 text-sm">Waiting for {selectedPlayer.name} to choose…</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Prompt reveal */}
              <AnimatePresence>
                {state.phase === "reveal" && (
                  <motion.div className="w-full flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {selectedPlayer && (
                      <p className="text-white/30 text-xs uppercase tracking-widest text-center">{selectedPlayer.name}</p>
                    )}

                    <PromptCard
                      type={state.chosenType ?? "truth"}
                      text={state.prompt ?? ""}
                      loading={!state.prompt}
                      playerName={selectedPlayer?.name}
                    />

                    {iAmHost || isMyTurn ? (
                      <motion.button onClick={() => room.next()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full bg-white text-black rounded-xl py-4 font-bold text-sm tracking-wide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>Next Turn →</motion.button>
                    ) : (
                      <p className="text-center text-white/30 text-sm">Waiting for next turn…</p>
                    )}

                    {state.players.length > 1 && (
                      <motion.div className="glass rounded-xl px-4 py-3 flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <span className="text-white/25 text-xs">Next to spin →</span>
                        {(() => {
                          const connected = state.players.filter((p) => p.connected);
                          const curIdx = connected.findIndex((p) => p.id === state.currentTurnId);
                          const nextP = connected[(curIdx + 1) % connected.length];
                          return (
                            <>
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">{nextP?.name.charAt(0).toUpperCase()}</div>
                              <span className="text-white/60 text-sm font-medium">{nextP?.name}</span>
                            </>
                          );
                        })()}
                      </motion.div>
                    )}

                    <AdSlot slot="room-between-rounds" format="rectangle" className="rounded-xl overflow-hidden mt-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChatPanel messages={room.messages} myName={myName} onSend={room.sendChat} />

      <div className="sticky bottom-0 border-t border-white/5 bg-black/90 backdrop-blur-md">
        <AdSlot slot="room-bottom-sticky" format="banner" />
      </div>
    </div>
  );
}
