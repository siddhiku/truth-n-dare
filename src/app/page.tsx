"use client";

import { motion } from "framer-motion";
import Link from "next/link";

function AnimatedBottle() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Glow halo */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        animate={{
          boxShadow: [
            "0 0 120px rgba(255,255,255,0.04)",
            "0 0 200px rgba(255,255,255,0.08)",
            "0 0 120px rgba(255,255,255,0.04)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Bottle */}
      <motion.div
        animate={{
          rotate: [0, 8, -8, 8, 0],
          y: [0, -12, 0],
        }}
        transition={{
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        className="opacity-20"
      >
        <svg
          viewBox="0 0 100 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="260"
          height="380"
        >
          <rect x="28" y="80" width="44" height="100" rx="8" fill="white" stroke="white" strokeWidth="0.5" />
          <rect x="38" y="38" width="24" height="46" rx="4" fill="white" stroke="white" strokeWidth="0.5" />
          <rect x="34" y="20" width="32" height="22" rx="5" fill="white" />
          <rect x="32" y="98" width="36" height="54" rx="3" fill="black" opacity="0.3" />
          <line x1="36" y1="84" x2="36" y2="168" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.15" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <motion.span
        whileHover={{ opacity: 1 }}
        className="text-white/40 hover:text-white text-sm tracking-wide transition-colors duration-200"
      >
        {children}
      </motion.span>
    </Link>
  );
}

function CTAButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`
          px-8 py-4 rounded-2xl font-semibold text-base tracking-wide text-center transition-all duration-200 cursor-pointer
          ${primary
            ? "bg-white text-black shadow-glow hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]"
            : "glass border border-white/10 text-white hover:bg-white/8"
          }
        `}
      >
        {children}
      </motion.div>
    </Link>
  );
}

const stagger = {
  container: {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  },
  item: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
      {/* Background bottle decoration */}
      <div className="absolute inset-0 z-0">
        <AnimatedBottle />
        {/* Radial gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/70 to-black pointer-events-none" />
      </div>

      {/* Nav */}
      <motion.nav
        className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-bold text-white text-lg tracking-tight">truth n dare</span>
        <div className="flex items-center gap-6">
          <NavLink href="/room/join">Join Room</NavLink>
          <NavLink href="/room/create">Create Room</NavLink>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.main
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pt-8 pb-20 md:pt-0"
        variants={stagger.container}
        initial="hidden"
        animate="show"
      >
        {/* Headline */}
        <motion.h1
          variants={stagger.item}
          className="text-[clamp(3.2rem,11vw,7rem)] font-black leading-[0.92] tracking-[-0.04em] text-white mb-6 max-w-4xl"
        >
          Spin.{" "}
          <span className="text-white/40">Confess.</span>{" "}
          <br />
          Survive.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={stagger.item}
          className="text-white/40 text-lg md:text-xl max-w-md mb-12 leading-relaxed"
        >
          AI-generated chaos for friends.
          <br />
          No rules. No mercy.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={stagger.item}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-none sm:w-auto"
        >
          <CTAButton href="/solo" primary>
            Play Solo
          </CTAButton>
          <CTAButton href="/room/create">Create Room</CTAButton>
          <CTAButton href="/room/join">Join Room</CTAButton>
        </motion.div>

        {/* Mode preview pills */}
        <motion.div
          variants={stagger.item}
          className="mt-16 flex gap-3 flex-wrap justify-center"
        >
          {[
            { label: "Easy", sub: "Harmless fun" },
            { label: "Crispy", sub: "Awkward pressure" },
            { label: "Ruthless", sub: "No mercy" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="glass rounded-xl px-4 py-2.5 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-white font-medium text-sm">{m.label}</span>
              <span className="text-white/30 text-xs">{m.sub}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 border-t border-white/5 px-6 py-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p className="text-white/20 text-xs">© 2025 Truth N Dare. Play responsibly.</p>
        <div className="flex gap-4">
          <Link href="/solo" className="text-white/20 hover:text-white/60 text-xs transition-colors">Solo Mode</Link>
          <Link href="/room/create" className="text-white/20 hover:text-white/60 text-xs transition-colors">Multiplayer</Link>
        </div>
      </motion.footer>
    </div>
  );
}
