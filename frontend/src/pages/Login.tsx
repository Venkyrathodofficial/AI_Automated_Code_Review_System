import { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  User,
  Mail,
  Lock,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Code2,
  Terminal,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SentinelLockLoader } from "@/components/SentinelLockLoader";

type AuthMode = "signin" | "signup" | "reset";

const contentByMode: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    submitText: string;
  }
> = {
  signin: {
    title: "Welcome Back",
    subtitle: "Sign in to monitor your security pipelines and pull request guardrails.",
    submitText: "Sign In",
  },
  signup: {
    title: "Create Your Account",
    subtitle: "Start securing every commit with automated real-time AI security reviews.",
    submitText: "Create Account",
  },
  reset: {
    title: "Reset Password",
    subtitle: "Enter your verified work email to receive a secure recovery link.",
    submitText: "Send Reset Link",
  },
};

const Login = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode: AuthMode = searchParams.get("signup") === "true" ? "signup" : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isInitialVerification = useRef(searchParams.get("verified") === "true");

  useEffect(() => {
    if (isInitialVerification.current) {
      // Ensure any session created during email token verification is cleared
      // so the user explicitly logs in using their newly created credentials
      supabase.auth.signOut().catch(() => {});
      setSuccess("Account email verified successfully! Please sign in with your credentials.");
      setMode("signin");
      // Clean query parameter from browser address bar
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
      const timer = setTimeout(() => {
        isInitialVerification.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  // Left panel showcase slides
  const [activeSlide, setActiveSlide] = useState(0);
  const showcaseSlides = [
    {
      icon: ShieldCheck,
      title: "Automated PR Defense Pipeline",
      description:
        "CodeAurora Sentinel hooks directly into GitHub pull requests to sweep for OWASP Top 10 vulnerabilities, leaked secrets, and style defects before code reaches staging.",
      statVal: "< 10s",
      statLabel: "Average PR Scan Latency",
      visual: (
        <div className="rounded-xl border border-white/10 bg-[#07090e]/90 p-4 font-mono text-[11px] text-[#2ef06e] space-y-1.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-gray-400 text-[10px] border-b border-white/10 pb-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-[#2ef06e] animate-pulse shadow-[0_0_8px_#2ef06e]" />
            <span className="font-semibold text-white">SENTINEL SCANNER ACTIVE • repo: production-api</span>
          </div>
          <div className="text-gray-400">&gt; running credential-entropy-scan...</div>
          <div className="text-[#2ef06e]">✓ 0 secrets found. Clean commit tree.</div>
          <div className="text-gray-400">&gt; running ast-code-review-engine...</div>
          <div className="text-[#2ef06e]">✓ Scan complete. Security Grade: A+ (Protected)</div>
        </div>
      ),
    },
    {
      icon: Sparkles,
      title: "Gemini 2.5 Flash Automated Fixes",
      description:
        "Never get bogged down by cryptic vulnerability alerts. Sentinel produces complete, copy-pasteable parameterized code fixes alongside contextual risk explanations.",
      statVal: "99.4%",
      statLabel: "Remediation Accuracy",
      visual: (
        <div className="rounded-xl border border-white/10 bg-[#07090e]/90 p-4 font-mono text-[11px] space-y-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] border-b border-white/10 pb-1.5 text-rose-400 font-bold">
            <span>CWE-89 SQL INJECTION DETECTED</span>
            <span className="bg-rose-950/60 text-rose-400 px-1.5 py-0.5 rounded border border-rose-800/40">
              HIGH
            </span>
          </div>
          <div className="text-rose-400/90 line-through bg-rose-950/20 px-2 py-1 rounded text-[10px]">
            {`- const query = \`SELECT * FROM users WHERE email = '\${email}'\`;`}
          </div>
          <div className="text-[#2ef06e] bg-emerald-950/20 px-2 py-1 rounded text-[10px]">
            {'+ const query = "SELECT * FROM users WHERE email = $1";'}
          </div>
          <div className="text-gray-400 text-[10px] italic pt-0.5">
            // Suggested fix: Parameterized query eliminates injection vector
          </div>
        </div>
      ),
    },
    {
      icon: KeyRound,
      title: "Early Access Developer Program",
      description:
        "Sentinel provides complimentary developer tier access for startup teams, open-source contributors, and engineering leaders. Unlock 100 automated scans every month.",
      statVal: "100",
      statLabel: "Free Scans / Month Granted",
      visual: (
        <div className="rounded-xl border border-white/10 bg-[#07090e]/90 p-4 font-mono text-[11px] space-y-2 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] border-b border-white/10 pb-1.5">
            <span className="text-gray-400">PROMO REDEMPTION STATUS</span>
            <span className="bg-[#2ef06e]/15 text-[#2ef06e] border border-[#2ef06e]/30 px-1.5 py-0.5 rounded font-bold">
              ACTIVE
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Granted Plan:</span>
            <span className="text-white font-bold">Developer Pro (Early Access)</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Scan Quota:</span>
            <span className="text-[#2ef06e] font-semibold">100 scans/month</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Zero Code Storage:</span>
            <span className="text-white">Active Guarantee</span>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // User login always directs to the User Dashboard (unless clearing initial verification callback)
  if (user && !isInitialVerification.current) {
    return <Navigate to="/dashboard" replace />;
  }

  const resetFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      sessionStorage.removeItem("sentinel_app_sidebar_scroll");
    } catch { }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Password and confirmation do not match.");
        setLoading(false);
        return;
      }

      const { error: signupError } = await signUp(email, password, name);
      if (signupError) {
        setError(signupError.message);
      } else {
        setSuccess("Account registered! Please check your email for the verification link, then sign in.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }
      setLoading(false);
      return;
    }

    const { error: signinError } = await signIn(email, password);
    if (signinError) {
      setError(signinError.message);
      setLoading(false);
      return;
    }

    isInitialVerification.current = false;
    setLoading(false);
    navigate("/dashboard", { replace: true });
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess("Password reset email sent. Please check your inbox.");
    }

    setLoading(false);
  };

  const current = contentByMode[mode];

  return (
    <div className="min-h-screen bg-[#060709] saas-unified-grid text-white font-sans antialiased selection:bg-[#2ef06e] selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* High-Tech Padlock Loading Animation Overlay */}
      {loading && (
        <SentinelLockLoader
          message={
            mode === "signup"
              ? "Creating protected account..."
              : mode === "reset"
                ? "Dispatching recovery link..."
                : "Authenticating credentials..."
          }
          subMessage="Verifying cryptographic session & access permissions"
        />
      )}

      {/* Soft Ambient Neon Glows */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-[500px] h-[350px] bg-[#2ef06e]/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-[#2ef06e]/5 rounded-full blur-[120px]" />

      {/* ───── TOP FLOATING HEADER ───── */}
      <header className="relative z-40 max-w-6xl mx-auto w-full pt-4 sm:pt-8 px-3.5 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-black border border-white/15 text-white group-hover:scale-105 transition-transform shadow-sm shrink-0">
            <ShieldCheck className="h-4 w-4 text-[#2ef06e]" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
            CodeAurora <span className="text-white font-black">Sentinel</span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#2ef06e]/15 text-[#2ef06e] border border-[#2ef06e]/30 tracking-wider">
              AI
            </span>
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-md shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#2ef06e]" />
          <span className="hidden xs:inline">Back to Homepage</span>
          <span className="xs:hidden">Home</span>
        </Link>
      </header>

      {/* ───── MAIN AUTH & SHOWCASE CONSOLE ───── */}
      <main className="relative z-20 flex-1 flex items-center justify-center max-w-6xl mx-auto w-full px-3.5 sm:px-6 py-6 sm:py-12">
        <div className="w-full grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ──── LEFT COLUMN: CYBERSECURITY SHOWCASE & 3D ARTWORK (5 COLS) ──── */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-between space-y-8 pr-4">

            {/* Header Eyebrow */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#2ef06e] shadow-[0_0_8px_#2ef06e] animate-pulse" />
                Continuous DevSecOps Platform
              </div>
              <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Secure Every Commit. <br />
                <span className="text-[#2ef06e] drop-shadow-[0_0_30px_rgba(46,240,110,0.4)]">
                  Zero Code Storage
                </span>
                .
              </h2>
            </div>

            {/* Seamless 3D Padlock & Interactive Graphic */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="pointer-events-none absolute w-60 h-60 bg-[#2ef06e]/15 rounded-full blur-[80px] animate-pulse-glow" />
              <img
                src="/sentinel_lock.jpg"
                alt="CodeAurora Sentinel 3D Security Lock"
                className="w-[200px] xl:w-[240px] object-contain select-none pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                style={{
                  mixBlendMode: "screen",
                  filter: "contrast(1.2) brightness(1.05)",
                  WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 92%)",
                  maskImage: "radial-gradient(ellipse at center, black 55%, transparent 92%)",
                }}
              />
            </div>

            {/* Rotating Dynamic Showcase Slide */}
            <div className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#2ef06e] shadow-sm">
                      {(() => {
                        const SlideIcon = showcaseSlides[activeSlide].icon;
                        return <SlideIcon className="h-5 w-5" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {showcaseSlides[activeSlide].title}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {showcaseSlides[activeSlide].description}
                      </p>
                    </div>
                  </div>

                  {/* Code Mockup / Visual */}
                  <div>{showcaseSlides[activeSlide].visual}</div>

                  {/* Stat Counter */}
                  <div className="flex items-center gap-4 pt-1">
                    <div>
                      <span className="text-2xl font-black text-white tracking-tight">
                        {showcaseSlides[activeSlide].statVal}
                      </span>
                      <span className="ml-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {showcaseSlides[activeSlide].statLabel}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slide Navigation Dots */}
              <div className="flex items-center gap-2 pt-1">
                {showcaseSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-6 bg-[#2ef06e]" : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                    aria-label={`Show slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ──── RIGHT COLUMN: SLEEK DARK GLASS AUTH FORM CARD (6 COLS) ──── */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[460px]">

              {/* Segmented Pill Mode Switcher (Sign In / Create Account) */}
              {mode !== "reset" && (
                <div className="p-1 bg-[#12141a]/90 border border-white/10 rounded-full flex items-center mb-5 sm:mb-6 shadow-xl backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className={`flex-1 py-2 sm:py-2.5 text-xs font-extrabold rounded-full transition-all ${mode === "signin"
                        ? "bg-white text-black shadow-md"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`flex-1 py-2 sm:py-2.5 text-xs font-extrabold rounded-full transition-all ${mode === "signup"
                        ? "bg-[#2ef06e] text-black shadow-md shadow-[#2ef06e]/20"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Main Auth Container Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl sm:rounded-3xl bg-[#0c0e14]/90 border border-white/10 p-5 xs:p-6 sm:p-8 md:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden"
              >
                {/* Glowing Top Accent Border */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#2ef06e]/60 to-transparent" />

                {/* Form Header */}
                <div className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                    {current.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {current.subtitle}
                  </p>
                </div>

                {/* Feedback Alerts */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs mb-4"
                    >
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl border border-[#2ef06e]/30 bg-emerald-950/30 text-[#2ef06e] text-xs mb-4"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2ef06e] mt-0.5" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === "reset" ? (
                  /* ─── PASSWORD RECOVERY FORM ─── */
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="resetEmail"
                        className="text-[11px] font-bold uppercase tracking-wider text-gray-300"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="resetEmail"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="developer@company.com"
                          required
                          className="h-11 pl-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[#2ef06e] focus-visible:ring-1 focus-visible:ring-[#2ef06e] text-base sm:text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-full font-extrabold bg-[#2ef06e] hover:bg-[#28d762] text-black shadow-lg shadow-[#2ef06e]/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Sending recovery email...</span>
                        </>
                      ) : (
                        <>
                          <span>{current.submitText}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors w-full pt-3"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 text-[#2ef06e]" /> Back to Sign In
                    </button>
                  </form>
                ) : (
                  /* ─── SIGN IN & SIGN UP FORM ─── */
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {/* Name Field (Sign Up only) */}
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="name"
                          className="text-[11px] font-bold uppercase tracking-wider text-gray-300"
                        >
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Alex Developer"
                            required
                            className="h-11 pl-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[#2ef06e] focus-visible:ring-1 focus-visible:ring-[#2ef06e] text-base sm:text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-[11px] font-bold uppercase tracking-wider text-gray-300"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="developer@company.com"
                          required
                          className="h-11 pl-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[#2ef06e] focus-visible:ring-1 focus-visible:ring-[#2ef06e] text-base sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="password"
                          className="text-[11px] font-bold uppercase tracking-wider text-gray-300"
                        >
                          Password
                        </Label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={() => switchMode("reset")}
                            className="text-xs font-semibold text-gray-400 hover:text-[#2ef06e] transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={mode === "signup" ? 8 : 6}
                          className="h-11 pl-10 pr-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[#2ef06e] focus-visible:ring-1 focus-visible:ring-[#2ef06e] text-base sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password (Sign Up only) */}
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="confirmPassword"
                          className="text-[11px] font-bold uppercase tracking-wider text-gray-300"
                        >
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="h-11 pl-10 pr-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-[#2ef06e] focus-visible:ring-1 focus-visible:ring-[#2ef06e] text-base sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            aria-label="Toggle confirm password visibility"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Remember Me (Sign In only) */}
                    {mode === "signin" && (
                      <div className="flex items-center gap-2.5 pt-1">
                        <Checkbox
                          id="remember"
                          checked={keepLoggedIn}
                          onCheckedChange={(checked) => setKeepLoggedIn(Boolean(checked))}
                          className="border-white/20 data-[state=checked]:bg-[#2ef06e] data-[state=checked]:border-[#2ef06e] data-[state=checked]:text-black"
                        />
                        <label
                          htmlFor="remember"
                          className="text-xs text-gray-400 cursor-pointer select-none font-medium hover:text-gray-300"
                        >
                          Remember this device for 30 days
                        </label>
                      </div>
                    )}

                    {/* Primary Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 w-full rounded-full font-extrabold bg-[#2ef06e] hover:bg-[#28d762] text-black shadow-xl shadow-[#2ef06e]/20 transition-all flex items-center justify-center gap-2 mt-4 hover:scale-[1.01]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-black" />
                          <span>Processing authentication...</span>
                        </>
                      ) : (
                        <>
                          <span>{current.submitText}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Privacy & Zero Human Code Access Footnote */}
                <div className="pt-5 sm:pt-6 mt-5 sm:mt-6 border-t border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-gray-400 font-medium text-center">
                  <ShieldCheck className="h-4 w-4 text-[#2ef06e] shrink-0" />
                  <span>Zero Human Code Access Architecture • In-Memory AST Scanning</span>
                </div>
              </motion.div>

              {/* Sub-footer Link */}
              <div className="mt-4 text-center">
                {mode === "signin" ? (
                  <p className="text-xs text-gray-400">
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-bold text-[#2ef06e] hover:underline"
                    >
                      Create account free
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-bold text-[#2ef06e] hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ───── BOTTOM FOOTER ───── */}
      <footer className="relative z-20 border-t border-white/[0.08] py-6 px-4 sm:px-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400">CodeAurora Sentinel AI</span>
            <span>•</span>
            <span>Enterprise-Grade Code Security & Compliance</span>
          </div>
          <div>&copy; {new Date().getFullYear()} CodeAurora. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
