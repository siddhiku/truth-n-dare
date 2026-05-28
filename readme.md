# 🍾 Truth n Dare — AI-Powered Party Game

> **Spin. Confess. Survive.**  
> Dynamic AI-generated chaos for friends, packed into a gorgeous glassmorphic web interface.

Live URL: **[truth-n-dare-phi.vercel.app](https://truth-n-dare-phi.vercel.app)**

---

## ✨ Features

- **Real-Time Multiplayer:** Live rooms over Socket.IO — join by code, see players appear instantly, and watch the bottle spin in sync on every device. The server is authoritative, so everyone lands on the same player and sees the same prompt.
- **Live Room Chat:** Mobile-friendly slide-up chat with message history, system join/leave notices, and an unread badge. Never covers gameplay.
- **Dynamic AI Prompt Generation:** Uses OpenAI's `gpt-4o-mini` API to generate unique, hilarious, and context-aware Truth and Dare prompts.
- **Three Chaos Levels:**
  - **🟢 Easy:** Harmless fun and light banter.
  - **🟡 Crispy:** Awkward questions, secret confessions, and mild pressure.
  - **🔴 Ruthless:** No filter, zero mercy, maximum chaos.
- **Solo Mode:** Instantly generate truths or dares for a quick single-player game.
- **Interactive Bottle Spinning:** Fully animated physics-based bottle spin and deceleration using Framer Motion.
- **Polished Audio Design:** Immersive sound effects for clicking, bottle spinning, player selection, card reveals, and transition milestones.
- **Modern Glassmorphic UI:** Smooth gradients, glowing micro-animations, clean typography, and a tailored futuristic dark mode theme.
- **Fail-Safe Fallbacks:** Robust database of fallback prompts built right in if the API limit is hit or if offline.

---

## 🏗️ Architecture

Two deployable pieces:

| Piece | Stack | Hosts on | Folder |
|-------|-------|----------|--------|
| Frontend | Next.js 15 (App Router), Tailwind, Framer Motion | Vercel | repo root |
| Realtime server | Node + Express + Socket.IO | Render / Railway | `server/` |

The frontend is mostly static + an edge `/api/prompt` route. **Real multiplayer**
(live presence, synced bottle spin, turn order, chat) runs through the standalone
Socket.IO server, because Vercel's serverless functions can't hold a persistent
WebSocket. Solo mode and the prompt API work without the server.

All game outcomes are decided server-side and broadcast to every player: the spin
target, whose turn it is, the current phase, the chosen prompt, and chat all live
in one server-held `RoomState` that fans out on every change. Clients send
*intents*; they never compute results. State is in-memory (a `Map` of rooms), so
swapping to Redis/Postgres later means replacing `server/src/rooms.ts` internals only.

---

## 🛠️ Tech Stack

- **Core Framework:** [Next.js](https://nextjs.org/) (App Router, Edge Runtime API routes)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Realtime:** [Socket.IO](https://socket.io/) (standalone Node + Express server)
- **AI Integration:** OpenAI API (`gpt-4o-mini`)
- **Deployment Platform:** [Vercel](https://vercel.com/) (frontend) + Render/Railway (server)

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/24f2005274-oss/truth-n-dare.git
cd truth-n-dare
```

### 2. Start the Realtime Server
```bash
cd server
npm install
cp .env.example .env        # defaults are fine for local
npm run dev                 # http://localhost:4000
```

### 3. Start the Frontend (in another terminal, from the repo root)
```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # already points NEXT_PUBLIC_SOCKET_URL at localhost:4000
npm run dev                  # http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) to play. Open two windows on the
same room code to see live multiplayer + chat in action.

*Note: If no OpenAI API key is specified, the app automatically falls back to the
built-in curated prompt pools.*

---

## 🔑 Environment Variables

**Frontend** (`.env.local`):

- `NEXT_PUBLIC_SOCKET_URL` — URL of the realtime server (required for multiplayer)
- `OPENAI_API_KEY` — optional; enables AI-generated prompts, otherwise a curated pool is used
- `NEXT_PUBLIC_ADSENSE_ID` — optional; ad slots render only when set

**Server** (`server/.env`):

- `PORT` — injected by the host; defaults to 4000
- `CLIENT_ORIGIN` — comma-separated allowed origins (your Vercel URL in prod)

---

## ⚡ Deployment

1. **Server → Render** (or Railway): point it at the `server/` directory. The
   included `server/render.yaml` sets build/start commands and the `/health` check.
   Set `CLIENT_ORIGIN` to your Vercel domain.
2. **Frontend → Vercel**: set `NEXT_PUBLIC_SOCKET_URL` to the Render URL. The
   `vercel.json` pins `npm install --legacy-peer-deps`. Then:
   ```bash
   npx vercel --prod
   ```

---

## 📄 License
This project is private and intended for entertainment purposes. Play responsibly!
