# 🍾 Truth n Dare — AI-Powered Party Game

> **Spin. Confess. Survive.**  
> Dynamic AI-generated chaos for friends, packed into a gorgeous glassmorphic web interface.

Live URL: **[truth-n-dare-phi.vercel.app](https://truth-n-dare-phi.vercel.app)**

---

## ✨ Features

- **Dynamic AI Prompt Generation:** Uses OpenAI's `gpt-4o-mini` API to generate unique, hilarious, and context-aware Truth and Dare prompts.
- **Three Chaos Levels:**
  - **🟢 Easy:** Harmless fun and light banter.
  - **🟡 Crispy:** Awkward questions, secret confessions, and mild pressure.
  - **🔴 Ruthless:** No filter, zero mercy, maximum chaos.
- **Local Party Lobby:** Multi-player game mode. Create a lobby, invite friends, add player names, spin the bottle, and track turns.
- **Solo Mode:** Instantly generate truths or dares for a quick single-player game.
- **Interactive Bottle Spinning:** Fully animated physics-based bottle spin and deceleration using Framer Motion.
- **Polished Audio Design:** Immersive sound effects for clicking, bottle spinning, player selection, card reveals, and transition milestones.
- **Modern Glassmorphic UI:** Smooth gradients, glowing micro-animations, clean typography, and a tailored futuristic dark mode theme.
- **Fail-Safe Fallbacks:** Robust database of fallback prompts built right in if the API limit is hit or if offline.

---

## 🛠️ Tech Stack

- **Core Framework:** [Next.js](https://nextjs.org/) (App Router, Edge Runtime API routes)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **AI Integration:** OpenAI API (`gpt-4o-mini`)
- **Deployment Platform:** [Vercel](https://vercel.com/)

---

## 🚀 Local Development Setup

To run Truth n Dare on your local machine:

### 1. Clone the Repository
```bash
git clone https://github.com/24f2005274-oss/truth-n-dare.git
cd truth-n-dare
```

### 2. Install Dependencies
Install all peer dependencies correctly:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your OpenAI API key to enable AI-powered prompts:
```env
OPENAI_API_KEY=your_openai_api_key_here
```
*Note: If no API key is specified, the application will automatically fall back to the built-in curated prompt pools.*

### 4. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to play!

---

## ⚡ Deployment to Vercel

The application is fully optimized to run on Vercel. 

To deploy changes:
1. Ensure your `vercel.json` contains the custom install command configuration:
   ```json
   {
     "installCommand": "npm install --legacy-peer-deps"
   }
   ```
2. Trigger the deployment:
   ```bash
   npx vercel --prod
   ```

---

## 📄 License
This project is private and intended for entertainment purposes. Play responsibly!