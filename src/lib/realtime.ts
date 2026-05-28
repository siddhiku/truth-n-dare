import type { ChaosMode, PromptType } from "./prompts";

export type RoomPhase = "lobby" | "spinning" | "choosing" | "loading" | "reveal";

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  mode: ChaosMode;
  phase: RoomPhase;
  players: PlayerState[];
  round: number;
  currentTurnId: string | null;
  selectedId: string | null;
  chosenType: PromptType | null;
  prompt: string | null;
  spinNonce: number;
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
  system?: boolean;
}

export interface ClientToServer {
  "room:join": (p: { code: string; name: string }) => void;
  "host:setMode": (p: { mode: ChaosMode }) => void;
  "game:start": () => void;
  "bottle:spin": () => void;
  "turn:choose": (p: { type: PromptType }) => void;
  "round:next": () => void;
  "chat:send": (p: { text: string }) => void;
}

export interface ServerToClient {
  "room:state": (state: RoomState) => void;
  "room:error": (p: { message: string }) => void;
  "bottle:spinning": (p: { selectedId: string; nonce: number }) => void;
  "chat:history": (messages: ChatMessage[]) => void;
  "chat:message": (message: ChatMessage) => void;
}

export const MAX_CHAT_LEN = 240;

export const SPIN_DURATION_MS = 4200;
export const MIN_PLAYERS = 2;
