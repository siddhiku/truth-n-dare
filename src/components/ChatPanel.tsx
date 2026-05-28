"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "@/lib/realtime";
import { MAX_CHAT_LEN } from "@/lib/realtime";

interface ChatPanelProps {
  messages: ChatMessage[];
  myName: string;
  onSend: (text: string) => void;
}

function timeLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({ messages, myName, onSend }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const seenCount = useRef(messages.length);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track unread while closed.
  useEffect(() => {
    if (open) {
      seenCount.current = messages.length;
      setUnread(0);
    } else {
      setUnread(Math.max(0, messages.length - seenCount.current));
    }
  }, [messages.length, open]);

  // Auto-scroll to newest whenever open and messages change.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Focus input when panel opens.
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }, [draft, onSend]);

  return (
    <>
      {/* Floating toggle */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full glass-strong border border-white/15 flex items-center justify-center shadow-glowSoft"
        style={{ width: 52, height: 52 }}
        aria-label="Toggle chat"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-white text-black text-[11px] font-bold flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Backdrop + sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed left-0 right-0 bottom-0 z-50 mx-auto max-w-lg flex flex-col glass-strong border-t border-white/10 rounded-t-3xl overflow-hidden"
              style={{ height: "min(70vh, 560px)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
            >
              {/* Handle + header */}
              <div className="flex flex-col items-center pt-2.5 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 py-2 border-b border-white/5 flex-shrink-0">
                <span className="text-white font-bold text-sm tracking-tight">Room Chat</span>
                <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 text-lg leading-none w-7 h-7 flex items-center justify-center">×</button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
                {messages.length === 0 && (
                  <p className="text-white/25 text-sm text-center mt-8">No messages yet. Say hi 👋</p>
                )}
                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    if (m.system) {
                      return (
                        <motion.p
                          key={m.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-white/25 text-xs py-0.5"
                        >
                          {m.text}
                        </motion.p>
                      );
                    }
                    const mine = m.name === myName;
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-[78%] ${mine ? "self-end items-end" : "self-start items-start"}`}
                      >
                        {!mine && <span className="text-white/40 text-[11px] px-1 mb-0.5">{m.name}</span>}
                        <div className={`rounded-2xl px-3.5 py-2 text-sm leading-snug ${mine ? "bg-white text-black rounded-br-md" : "bg-white/8 text-white rounded-bl-md"}`}>
                          {m.text}
                        </div>
                        <span className="text-white/20 text-[10px] px-1 mt-0.5">{timeLabel(m.ts)}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Composer */}
              <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHAT_LEN))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
                  placeholder="Message the room..."
                  maxLength={MAX_CHAT_LEN}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-white/25"
                />
                <motion.button
                  onClick={submit}
                  disabled={!draft.trim()}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-30 flex-shrink-0"
                  aria-label="Send"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
