import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Terminal,
} from "lucide-react";

export default function EmailVerified() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<number>(1);
  const [countdown, setCountdown] = useState<number>(3);

  // Animation progression steps
  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 1200);
    const timer2 = setTimeout(() => setStep(3), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Countdown timer for automatic redirect once step 3 is reached
  useEffect(() => {
    if (step < 3) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/login?verified=true");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, navigate]);

  const handleProceed = () => {
    navigate("/login?verified=true");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#060709] text-white flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none font-sans">
      {/* Background radial glowing gradients */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#2ef06e]/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/15 rounded-full blur-[90px]" />

      {/* Cybernetic grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Main Glassmorphic Activation Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-3xl bg-[#0c0e14]/95 border border-white/10 p-7 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center overflow-hidden"
      >
        {/* Top Glowing Laser Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2ef06e] to-transparent shadow-[0_0_12px_#2ef06e]" />

        {/* Brand Eyebrow */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2ef06e]/30 bg-[#2ef06e]/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#2ef06e] mb-7 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#2ef06e] shadow-[0_0_8px_#2ef06e] animate-ping" />
          <span>Sentinel Cryptographic Handshake</span>
        </div>

        {/* Animated Cyber Shield & Checkmark Emblem */}
        <div className="relative mx-auto w-28 h-28 mb-8 flex items-center justify-center">
          {/* Concentric Pulsing Radar Rings */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-[#2ef06e]/30"
          />
          <motion.div
            animate={{ scale: [1.1, 1.65, 1.1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute inset-0 rounded-full border border-[#2ef06e]/20"
          />

          {/* Central Hexagonal Shield Badge */}
          <motion.div
            animate={{
              boxShadow:
                step === 3
                  ? "0 0 50px rgba(46, 240, 110, 0.45)"
                  : "0 0 25px rgba(46, 240, 110, 0.2)",
            }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-24 h-24 rounded-2xl bg-[#12151f] border-2 border-[#2ef06e] flex items-center justify-center overflow-hidden"
          >
            {/* Spinning holographic background scanner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(46,240,110,0.25)_180deg,transparent_360deg)] opacity-60"
            />

            <AnimatePresence mode="wait">
              {step < 3 ? (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <Lock className="w-10 h-10 text-[#2ef06e] animate-pulse" />
                </motion.div>
              ) : (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative z-10"
                >
                  <ShieldCheck className="w-12 h-12 text-[#2ef06e] drop-shadow-[0_0_15px_#2ef06e]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Dynamic Multi-Stage Heading & Status */}
        <div className="space-y-3 mb-8 min-h-[96px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Verifying Token...
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 font-mono flex items-center justify-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#2ef06e]" />
                  <span>Validating cryptographic registration key</span>
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-2"
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Activating Engines...
                </h1>
                <p className="text-xs sm:text-sm text-[#2ef06e] font-mono flex items-center justify-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#2ef06e] animate-spin" />
                  <span>Arming SAST AST analyzers &amp; secret guards</span>
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-2"
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Account Verified!
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Your email has been confirmed. Your CodeAurora Sentinel workspace is fully armed and ready.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Verification Checkpoints */}
        <div className="bg-[#10131c] rounded-2xl border border-white/5 p-4 mb-7 text-left space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-[#2ef06e]" : "bg-gray-600"}`} />
              Cryptographic Token Validation
            </span>
            <span className="text-[#2ef06e] font-bold">
              {step >= 1 ? "COMPLETE" : "WAITING"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-[#2ef06e]" : "bg-gray-600"}`} />
              Repository Scanning Engine Auth
            </span>
            <span className="text-[#2ef06e] font-bold">
              {step >= 2 ? "ACTIVE" : "PENDING"}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${step >= 3 ? "bg-[#2ef06e]" : "bg-gray-600"}`} />
              Continuous DevSecOps Workspace
            </span>
            <span className="text-[#2ef06e] font-bold">
              {step >= 3 ? "ARMED" : "INITIALIZING"}
            </span>
          </div>
        </div>

        {/* Progress Bar & Countdown / CTA Button */}
        <div className="space-y-4">
          {/* Animated Progress Bar */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "20%" }}
              animate={{
                width: step === 1 ? "40%" : step === 2 ? "75%" : "100%",
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-[#2ef06e] shadow-[0_0_12px_#2ef06e]"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleProceed}
            className="w-full group relative inline-flex items-center justify-center gap-2.5 rounded-full bg-[#2ef06e] px-6 py-3.5 text-sm font-extrabold text-black transition-all hover:bg-[#28d762] hover:shadow-[0_0_30px_rgba(46,240,110,0.45)] active:scale-[0.98]"
          >
            <span>Proceed to Login</span>
            {step === 3 && (
              <span className="text-xs bg-black/15 px-2 py-0.5 rounded-full font-mono">
                ({countdown}s)
              </span>
            )}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Footer Subtext */}
        <p className="mt-5 text-[11px] text-gray-500 font-mono">
          CodeAurora Sentinel AI &bull; Continuous Application Security
        </p>
      </motion.div>
    </div>
  );
}
