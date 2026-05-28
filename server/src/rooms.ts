import {
  ChaosMode,
  PromptType,
  RoomState,
  PlayerState,
  ChatMessage,
  MIN_PLAYERS,
  MAX_CHAT_LEN,
  CHAT_HISTORY,
} from "./types";

interface InternalRoom {
  state: RoomState;
  // socket.id -> playerId, so a disconnect can find its player
  sockets: Map<string, string>;
  // recent chat, capped at CHAT_HISTORY
  chat: ChatMessage[];
}

export class RoomStore {
  private rooms = new Map<string, InternalRoom>();

  get size(): number {
    return this.rooms.size;
  }

  private fresh(code: string): InternalRoom {
    return {
      state: {
        code,
        mode: "easy",
        phase: "lobby",
        players: [],
        round: 1,
        currentTurnId: null,
        selectedId: null,
        chosenType: null,
        prompt: null,
        spinNonce: 0,
      },
      sockets: new Map(),
      chat: [],
    };
  }

  /** Recent chat history for a room (oldest first). */
  history(code: string): ChatMessage[] {
    return this.rooms.get(code)?.chat ?? [];
  }

  private pushChat(code: string, msg: ChatMessage): ChatMessage | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.chat.push(msg);
    if (room.chat.length > CHAT_HISTORY) {
      room.chat.splice(0, room.chat.length - CHAT_HISTORY);
    }
    return msg;
  }

  /** Add a player chat message. Returns the stored message or null if rejected. */
  chat(code: string, socketId: string, text: string): ChatMessage | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    const playerId = room.sockets.get(socketId);
    const player = room.state.players.find((p) => p.id === playerId);
    if (!player) return null;
    const clean = text.trim().slice(0, MAX_CHAT_LEN);
    if (!clean) return null;
    return this.pushChat(code, {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: player.name,
      text: clean,
      ts: Date.now(),
    });
  }

  /** Add a system notice (e.g. "X joined"). */
  system(code: string, text: string): ChatMessage | null {
    return this.pushChat(code, {
      id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: "",
      text,
      ts: Date.now(),
      system: true,
    });
  }

  /**
   * Join a room (creating it if absent). Reconnects by name: if the name
   * already exists, that slot is reclaimed instead of duplicated.
   * Returns the player's id, or an error string.
   */
  join(
    code: string,
    socketId: string,
    name: string
  ): { playerId: string; name: string; reconnected: boolean } | { error: string } {
    const clean = name.trim().slice(0, 20);
    if (!clean) return { error: "Name required" };

    let room = this.rooms.get(code);
    if (!room) {
      room = this.fresh(code);
      this.rooms.set(code, room);
    }

    const existing = room.state.players.find(
      (p) => p.name.toLowerCase() === clean.toLowerCase()
    );

    if (existing) {
      // Reconnect: only allow reclaiming a slot that's currently disconnected.
      if (existing.connected) {
        return { error: "Name already taken in this room" };
      }
      existing.connected = true;
      room.sockets.set(socketId, existing.id);
      return { playerId: existing.id, name: existing.name, reconnected: true };
    }

    // New player. First player becomes host.
    const playerId = `p_${Math.random().toString(36).slice(2, 10)}`;
    const isHost = room.state.players.length === 0;
    const player: PlayerState = { id: playerId, name: clean, isHost, connected: true };
    room.state.players.push(player);
    room.sockets.set(socketId, playerId);

    if (isHost && !room.state.currentTurnId) {
      room.state.currentTurnId = playerId;
    }
    return { playerId, name: clean, reconnected: false };
  }

  /** Mark the socket's player disconnected. Returns the affected room + player name. */
  disconnect(socketId: string): { code: string; name: string; dropped: boolean } | null {
    for (const [code, room] of this.rooms) {
      const playerId = room.sockets.get(socketId);
      if (!playerId) continue;
      room.sockets.delete(socketId);
      const player = room.state.players.find((p) => p.id === playerId);
      const name = player?.name ?? "";
      if (player) player.connected = false;

      // If everyone is gone, drop the room to free memory.
      if (room.state.players.every((p) => !p.connected)) {
        this.rooms.delete(code);
        return { code, name, dropped: true };
      }

      // If the disconnecting player held the turn, pass it on.
      if (room.state.currentTurnId === playerId && room.state.phase !== "lobby") {
        this.advanceTurn(code);
      }
      // If host left, promote the next connected player.
      if (player?.isHost) {
        const next = room.state.players.find((p) => p.connected);
        if (next) {
          player.isHost = false;
          next.isHost = true;
        }
      }
      return { code, name, dropped: false };
    }
    return null;
  }

  get(code: string): RoomState | null {
    return this.rooms.get(code)?.state ?? null;
  }

  private isHost(code: string, socketId: string): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    const playerId = room.sockets.get(socketId);
    const player = room.state.players.find((p) => p.id === playerId);
    return !!player?.isHost;
  }

  playerIdOf(code: string, socketId: string): string | null {
    return this.rooms.get(code)?.sockets.get(socketId) ?? null;
  }

  setMode(code: string, socketId: string, mode: ChaosMode): boolean {
    const room = this.rooms.get(code);
    if (!room || !this.isHost(code, socketId)) return false;
    if (room.state.phase !== "lobby") return false;
    room.state.mode = mode;
    return true;
  }

  start(code: string, socketId: string): boolean {
    const room = this.rooms.get(code);
    if (!room || !this.isHost(code, socketId)) return false;
    const connected = room.state.players.filter((p) => p.connected);
    if (connected.length < MIN_PLAYERS) return false;
    room.state.phase = "spinning";
    room.state.round = 1;
    room.state.currentTurnId = connected[0].id;
    room.state.selectedId = null;
    room.state.prompt = null;
    room.state.chosenType = null;
    return true;
  }

  /**
   * Authoritative spin. Only the player whose turn it is may spin.
   * Server picks the target uniformly from OTHER connected players.
   * Returns the selected playerId + a fresh nonce, or null if rejected.
   */
  spin(code: string, socketId: string): { selectedId: string; nonce: number } | null {
    const room = this.rooms.get(code);
    if (!room || room.state.phase !== "spinning") return null;
    const playerId = room.sockets.get(socketId);
    if (playerId !== room.state.currentTurnId) return null;

    const others = room.state.players.filter(
      (p) => p.connected && p.id !== playerId
    );
    const pool = others.length > 0 ? others : room.state.players.filter((p) => p.connected);
    if (pool.length === 0) return null;

    const target = pool[Math.floor(Math.random() * pool.length)];
    room.state.selectedId = target.id;
    room.state.chosenType = null;
    room.state.prompt = null;
    room.state.spinNonce += 1;
    // Phase flips to "choosing" only after the client-side spin animation;
    // server records selection immediately but waits on the choose() event.
    room.state.phase = "choosing";
    return { selectedId: target.id, nonce: room.state.spinNonce };
  }

  choose(code: string, socketId: string, type: PromptType, prompt: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.state.phase !== "choosing") return false;
    // Anyone in the room may submit the chosen type for the selected player
    // (the selected player typically chooses, but we don't hard-gate it).
    if (!room.sockets.get(socketId)) return false;
    room.state.chosenType = type;
    room.state.prompt = prompt;
    room.state.phase = "reveal";
    return true;
  }

  private advanceTurn(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const connected = room.state.players.filter((p) => p.connected);
    if (connected.length === 0) return;
    const curIdx = connected.findIndex((p) => p.id === room.state.currentTurnId);
    const next = connected[(curIdx + 1 + connected.length) % connected.length];
    room.state.currentTurnId = next.id;
  }

  next(code: string, socketId: string): boolean {
    const room = this.rooms.get(code);
    if (!room || !room.sockets.get(socketId)) return false;
    if (room.state.phase !== "reveal") return false;
    this.advanceTurn(code);
    room.state.round += 1;
    room.state.selectedId = null;
    room.state.chosenType = null;
    room.state.prompt = null;
    room.state.phase = "spinning";
    return true;
  }
}
