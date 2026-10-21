import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface SentinelLockLoaderProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export function SentinelLockLoader({
  message = "Authenticating credentials...",
  subMessage = "Verifying cryptographic session & access permissions",
  fullscreen = true,
}: SentinelLockLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Establishing encrypted TLS handshake...",
    "Validating cryptographic credentials...",
    "Querying Sentinel security permissions...",
    "Initializing protected workspace...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1100);
    return () => clearInterval(timer);
  }, [steps.length]);

  const content = (
    <div className="relative flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto select-none">
      {/* Soft Ambient Neon Glow */}
      <div className="pointer-events-none absolute w-80 h-80 bg-[#2ef06e]/15 rounded-full blur-[100px] animate-pulse-glow" />

      {/* Interactive Padlock Stage with Circuit Traces */}
      <div className="relative w-[320px] sm:w-[380px] h-[220px] sm:h-[260px] flex items-center justify-center">
        {/* Animated SVG Circuit Lines Left & Right */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 380 260"
          fill="none"
        >
          {/* Left Circuit Branch */}
          <path
            d="M 140 140 L 90 140 L 50 100 L 20 100"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />
          <path
            d="M 140 140 L 90 140 L 50 100 L 20 100"
            stroke="#2ef06e"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            className="animate-circuit-trace"
          />
          <circle cx="50" cy="100" r="3" fill="#2ef06e" />
          <circle cx="20" cy="100" r="4" fill="#111317" stroke="#2ef06e" strokeWidth="1.5" />

          <path
            d="M 140 170 L 95 170 L 65 195 L 30 195"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />
          <path
            d="M 140 170 L 95 170 L 65 195 L 30 195"
            stroke="#2ef06e"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            className="animate-circuit-trace"
          />
          <circle cx="65" cy="195" r="3" fill="#2ef06e" />
          <circle cx="30" cy="195" r="4" fill="#111317" stroke="#2ef06e" strokeWidth="1.5" />

          {/* Right Circuit Branch */}
          <path
            d="M 240 140 L 290 140 L 330 100 L 360 100"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />
          <path
            d="M 240 140 L 290 140 L 330 100 L 360 100"
            stroke="#2ef06e"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            className="animate-circuit-trace"
          />
          <circle cx="330" cy="100" r="3" fill="#2ef06e" />
          <circle cx="360" cy="100" r="4" fill="#111317" stroke="#2ef06e" strokeWidth="1.5" />

          <path
            d="M 240 170 L 285 170 L 315 195 L 350 195"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />
          <path
            d="M 240 170 L 285 170 L 315 195 L 350 195"
            stroke="#2ef06e"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            className="animate-circuit-trace"
          />
          <circle cx="315" cy="195" r="3" fill="#2ef06e" />
          <circle cx="350" cy="195" r="4" fill="#111317" stroke="#2ef06e" strokeWidth="1.5" />
        </svg>

        {/* Pulsing Scanner Ring behind shackle */}
        <motion.div
          animate={{ scale: [0.92, 1.06, 0.92], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[18%] left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border border-[#2ef06e]/40 shadow-[0_0_20px_rgba(46,240,110,0.3)] pointer-events-none"
        />

        {/* 3D Metallic Padlock with Breathing Animation */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <img
            src="/sentinel_lock.jpg"
            alt="Sentinel Security Lock"
            className="w-[180px] sm:w-[210px] object-contain select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)]"
            style={{
              mixBlendMode: "screen",
              filter: "contrast(1.2) brightness(1.08)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 56%, transparent 92%)",
              maskImage: "radial-gradient(ellipse at center, black 56%, transparent 92%)",
            }}
          />
        </motion.div>
      </div>

      {/* 4 Sequential Pulsing Green Status LEDs */}
      <div className="flex items-center gap-2.5 mt-2 mb-4">
        {[0, 1, 2, 3].map((dot) => (
          <motion.span
            key={dot}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.9, 1.25, 0.9],
              boxShadow: [
                "0 0 0px #2ef06e",
                "0 0 10px #2ef06e",
                "0 0 0px #2ef06e",
              ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: dot * 0.25,
              ease: "easeInOut",
            }}
            className="h-2 w-2 rounded-full bg-[#2ef06e]"
          />
        ))}
      </div>

      {/* Main Title & Dynamic Step Readout */}
      <div className="space-y-1.5 mb-5">
        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#2ef06e]" />
          <span>{message}</span>
        </h3>
        <p className="font-mono text-xs text-[#2ef06e] h-5 transition-all">
          &gt; {steps[stepIndex]}
        </p>
        <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
          {subMessage}
        </p>
      </div>

      {/* Indeterminate Glowing Neon Progress Bar */}
      <div className="w-56 sm:w-64 h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#2ef06e] to-transparent shadow-[0_0_12px_#2ef06e]"
        />
      </div>

      {/* Security Tag */}
      <div className="mt-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
        TLS 1.3 • AES-256-GCM SECURE CHANNEL
      </div>
    </div>
  );

  if (!fullscreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060709]/95 saas-unified-grid backdrop-blur-xl">
      {content}
    </div>
  );
}
