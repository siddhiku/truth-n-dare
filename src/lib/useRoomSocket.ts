"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { ChaosMode, PromptType } from "./prompts";
import type {
  RoomState,
  ChatMessage,
  ClientToServer,
  ServerToClient,
} from "./realtime";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export interface SpinSignal {
  selectedId: string;
  nonce: number;
}

export interface UseRoomSocket {
  state: RoomState | null;
  connected: boolean;
  error: string | null;
  /** Latest authoritative spin result; nonce changes on each new spin. */
  spinSignal: SpinSignal | null;
  messages: ChatMessage[];
  setMode: (mode: ChaosMode) => void;
  start: () => void;
  spin: () => void;
  choose: (type: PromptType) => void;
  next: () => void;
  sendChat: (text: string) => void;
}

export function useRoomSocket(code: string, name: string): UseRoomSocket {
  const socketRef = useRef<Socket<ServerToClient, ClientToServer> | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spinSignal, setSpinSignal] = useState<SpinSignal | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!code || !name) return;

    const socket: Socket<ServerToClient, ClientToServer> = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      // (Re)join on every (re)connect so a dropped socket reclaims its slot.
      socket.emit("room:join", { code, name });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room:state", (s) => {
      setState(s);
      setError(null);
    });

    socket.on("room:error", ({ message }) => setError(message));

    socket.on("bottle:spinning", (sig) => setSpinSignal(sig));

    // Server re-sends full history on every (re)join, so replace rather than append.
    socket.on("chat:history", (history) => setMessages(history));
    socket.on("chat:message", (msg) =>
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg].slice(-100)
      )
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [code, name]);

  const setMode = useCallback((mode: ChaosMode) => {
    socketRef.current?.emit("host:setMode", { mode });
  }, []);
  const start = useCallback(() => {
    socketRef.current?.emit("game:start");
  }, []);
  const spin = useCallback(() => {
    socketRef.current?.emit("bottle:spin");
  }, []);
  const choose = useCallback((type: PromptType) => {
    socketRef.current?.emit("turn:choose", { type });
  }, []);
  const next = useCallback(() => {
    socketRef.current?.emit("round:next");
  }, []);
  const sendChat = useCallback((text: string) => {
    const clean = text.trim();
    if (clean) socketRef.current?.emit("chat:send", { text: clean });
  }, []);

  return {
    state, connected, error, spinSignal, messages,
    setMode, start, spin, choose, next, sendChat,
  };
}
