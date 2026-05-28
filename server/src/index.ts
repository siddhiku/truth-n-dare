import http from "http";
import express from "express";
import { Server } from "socket.io";
import { RoomStore } from "./rooms";
import { pickPrompt } from "./prompts";
import { ClientToServer, ServerToClient, MODES } from "./types";

const PORT = Number(process.env.PORT) || 4000;

// Origins allowed to open a socket. Comma-separated env, defaults to local dev.
const ALLOWED = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.get("/health", (_req, res) => res.json({ ok: true, rooms: store.size }));

const server = http.createServer(app);
const io = new Server<ClientToServer, ServerToClient>(server, {
  cors: { origin: ALLOWED, methods: ["GET", "POST"] },
});

const store = new RoomStore();

io.on("connection", (socket) => {
  // The room this socket belongs to, set on join. One socket = one room.
  let joinedCode: string | null = null;

  const broadcast = (code: string) => {
    const state = store.get(code);
    if (state) io.to(code).emit("room:state", state);
  };

  socket.on("room:join", ({ code, name }) => {
    const clean = String(code || "").toUpperCase().slice(0, 6);
    if (clean.length !== 6) {
      socket.emit("room:error", { message: "Invalid room code" });
      return;
    }
    const result = store.join(clean, socket.id, String(name || ""));
    if ("error" in result) {
      socket.emit("room:error", { message: result.error });
      return;
    }
    joinedCode = clean;
    socket.join(clean);

    // Send recent chat to the joiner, then broadcast a system notice + state.
    socket.emit("chat:history", store.history(clean));
    const notice = store.system(
      clean,
      `${result.name} ${result.reconnected ? "reconnected" : "joined"}`
    );
    if (notice) io.to(clean).emit("chat:message", notice);
    broadcast(clean);
  });

  socket.on("chat:send", ({ text }) => {
    if (!joinedCode) return;
    const msg = store.chat(joinedCode, socket.id, String(text || ""));
    if (msg) io.to(joinedCode).emit("chat:message", msg);
  });

  socket.on("host:setMode", ({ mode }) => {
    if (!joinedCode || !MODES.includes(mode)) return;
    if (store.setMode(joinedCode, socket.id, mode)) broadcast(joinedCode);
  });

  socket.on("game:start", () => {
    if (!joinedCode) return;
    if (store.start(joinedCode, socket.id)) broadcast(joinedCode);
  });

  socket.on("bottle:spin", () => {
    if (!joinedCode) return;
    const result = store.spin(joinedCode, socket.id);
    if (!result) return;
    // Everyone runs the identical landing animation...
    io.to(joinedCode).emit("bottle:spinning", result);
    // ...and the authoritative state (phase=choosing) follows.
    broadcast(joinedCode);
  });

  socket.on("turn:choose", ({ type }) => {
    if (!joinedCode || (type !== "truth" && type !== "dare")) return;
    const state = store.get(joinedCode);
    if (!state) return;
    const prompt = pickPrompt(type, state.mode);
    if (store.choose(joinedCode, socket.id, type, prompt)) broadcast(joinedCode);
  });

  socket.on("round:next", () => {
    if (!joinedCode) return;
    if (store.next(joinedCode, socket.id)) broadcast(joinedCode);
  });

  socket.on("disconnect", () => {
    const result = store.disconnect(socket.id);
    if (!result || result.dropped) return;
    const notice = store.system(result.code, `${result.name} left`);
    if (notice) io.to(result.code).emit("chat:message", notice);
    broadcast(result.code);
  });
});

server.listen(PORT, () => {
  console.log(`Truth N Dare realtime server on :${PORT}`);
  console.log(`Allowed origins: ${ALLOWED.join(", ")}`);
});
