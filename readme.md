# Truth N Dare

A minimal black & white multiplayer party game. Spin the bottle, get AI-flavored
truths and dares, play solo or with friends in real time.

## Architecture

Two deployable pieces:

| Piece | Stack | Hosts on | Folder |
|-------|-------|----------|--------|
| Frontend | Next.js 15 (App Router), Tailwind, Framer Motion | Vercel | repo root |
| Realtime server | Node + Express + Socket.IO | Render / Railway | `server/` |

The frontend is mostly static + an edge `/api/prompt` route. **Real multiplayer**
(live room presence, synced bottle spin, turn order) runs through the standalone
Socket.IO server, because Vercel's serverless functions can't hold a persistent
WebSocket. Solo mode and the prompt API work without the server.

### Why the server is authoritative

All game outcomes are decided server-side and broadcast to every player:

- The **spin** target is chosen on the server, so every phone lands on the same
  person (clients only run the landing animation).
- Whose **turn** it is, the current **phase**, and the chosen **prompt text** all
  live in one server-held `RoomState` that fans out on every change.
- Clients send *intents* (`bottle:spin`, `turn:choose`, …); they never compute results.

State is in-memory for now (a `Map` of rooms). Swapping to Redis/Postgres later
means replacing `server/src/rooms.ts` internals only.

## Local development

```bash
# 1. Realtime server
cd server
npm install
cp .env.example .env        # defaults are fine for local
npm run dev                 # http://localhost:4000

# 2. Frontend (in another terminal, from repo root)
npm install --legacy-peer-deps   # React 19 RC needs the legacy flag
cp .env.example .env.local
# .env.local already points NEXT_PUBLIC_SOCKET_URL at localhost:4000
npm run dev                 # http://localhost:3000
```

Open two browser windows on `/room/create` + `/room/join` with the same code to
see live sync.

## Environment variables

**Frontend** (`.env.local`):

- `NEXT_PUBLIC_SOCKET_URL` — URL of the realtime server (required for multiplayer)
- `OPENAI_API_KEY` — optional; enables AI-generated prompts, otherwise a curated pool is used
- `NEXT_PUBLIC_ADSENSE_ID` — optional; ad slots render only when set
- `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` — reserved, not yet wired

**Server** (`server/.env`):

- `PORT` — injected by the host; defaults to 4000
- `CLIENT_ORIGIN` — comma-separated allowed origins (your Vercel URL in prod)

## Deployment

1. **Server → Render** (or Railway): point it at the `server/` directory. The
   included `server/render.yaml` sets build/start commands and the `/health` check.
   Set `CLIENT_ORIGIN` to your Vercel domain.
2. **Frontend → Vercel**: set `NEXT_PUBLIC_SOCKET_URL` to the Render URL. Deploy.

## Known issues

- `next@15.0.3` has a published CVE (CVE-2025-66478); upgrade Next when convenient.
- The realtime server uses in-memory rooms — they reset on restart and don't scale
  across multiple server instances yet (no Redis adapter).
