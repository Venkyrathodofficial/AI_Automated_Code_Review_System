import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Shield,
  User,
  Mail,
  Lock,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type AuthMode = "signin" | "signup" | "reset";

const contentByMode: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    submitText: string;
    panelTitle: string;
  }
> = {
  signin: {
    title: "Welcome Back",
    subtitle: "Sign in to continue securing your codebase.",
    submitText: "Sign in",
    panelTitle: "Welcome back",
  },
  signup: {
    title: "Create Account",
    subtitle: "Unlock automated, real-time AI security scans.",
    submitText: "Get Started",
    panelTitle: "Create account",
  },
  reset: {
    title: "Reset Password",
    subtitle: "Enter your email to receive a password recovery link.",
    submitText: "Send Reset Link",
    panelTitle: "Recover access",
  },
};

const Login = () => {
  const { user, signIn, signUp } = useAuth();
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

  // Left panel showcase slides
  const [activeSlide, setActiveSlide] = useState(0);
  const showcaseSlides = [
    {
      icon: Shield,
      title: "Automated Scan Pipeline",
      description: "CodeAurora Sentinel hooks directly into your PRs and push triggers to sweep for OWASP Top 10 vulnerabilities, leaked secrets, and style defects in under 10 seconds.",
      statVal: "10s",
      statLabel: "Average scan time",
      visual: (
        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-gray-500 text-[9px] border-b border-gray-800 pb-1.5 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SENTINEL SCAN ACTIVE • repo: frontend</span>
          </div>
          <div className="text-gray-400">&gt; running credential-check...</div>
          <div className="text-emerald-400">✓ 0 secrets found. Safe to push.</div>
          <div className="text-gray-400">&gt; running code-review-analyzer...</div>
          <div className="text-emerald-400">✓ scan completed. Security Grade: A+</div>
        </div>
      )
    },
    {
      icon: Sparkles,
      title: "AI Explanations & Fixes",
      description: "Not just alerts, but answers. Sentinel leverages Gemini 2.5 Flash to provide complete, copy-pasteable code fixes alongside context-aware security descriptions.",
      statVal: "99.4%",
      statLabel: "Vulnerability resolution accuracy",
      visual: (
        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 font-mono text-[10px] space-y-1 shadow-inner">
          <div className="text-red-400 font-bold border-b border-gray-800 pb-1 mb-1 text-[9px]">VULNERABILITY DETECTED • LINE 42</div>
          <div className="text-red-400/90 line-through bg-red-950/20 px-1 rounded">- const query = "SELECT * FROM users WHERE id = " + input;</div>
          <div className="text-emerald-400 bg-emerald-950/20 px-1 rounded">+ const query = "SELECT * FROM users WHERE id = $1";</div>
          <div className="text-emerald-500/80 mt-1.5 text-[9px] italic">// Fix: Swapped string concatenation for parameterized query</div>
        </div>
      )
    },
    {
      icon: KeyRound,
      title: "Early Access Beta Program",
      description: "Sentinel is currently offering complimentary Pro tier access for developer communities, hackathons, and early-adopter startups. Unlock 100 scans per month.",
      statVal: "100",
      statLabel: "Free scans/mo granted",
      visual: (
        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 font-mono text-[10px] space-y-2 shadow-inner text-emerald-400">
          <div className="flex justify-between text-[9px] border-b border-gray-800 pb-1.5">
            <span>PROMO REDEMPTION STATUS</span>
            <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded font-bold">SUCCESS</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Plan Granted:</span>
            <span className="text-white font-bold">Pro (Early Access)</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Monthly Scans:</span>
            <span className="text-white">100 scans/month</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Active Period:</span>
            <span className="text-white">90 Days (Renewable)</span>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % showcaseSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

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

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Password and confirm password must match.");
        setLoading(false);
        return;
      }

      const { error: signupError } = await signUp(email, password);
      if (signupError) {
        setError(signupError.message);
      } else {
        setSuccess("Account created. Check your email for verification, then sign in.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }
      setLoading(false);
      return;
    }

    const { error: signinError } = await signIn(email, password);
    if (signinError) setError(signinError.message);
    setLoading(false);
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
      setSuccess("Password reset link sent. Please check your email inbox.");
    }

    setLoading(false);
  };

  const current = contentByMode[mode];

  return (
    <div className="min-h-screen flex bg-background font-sans overflow-hidden text-foreground">
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-40">
        <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-1/4 w-[30rem] h-[30rem] bg-emerald-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full flex z-10">
        
        {/* Left Column: Premium SaaS Sidebar Showcase */}
        <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white relative overflow-hidden flex-col justify-between p-12 h-screen min-h-[600px] border-r border-emerald-950">
          
          {/* Subtle overlay grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c2117_1px,transparent_1px),linear-gradient(to_bottom,#0c2117_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-35" />
          
          {/* Glowing Blobs */}
          <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 -right-12 w-60 h-60 bg-emerald-400/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Branding Header */}
            <div>
              <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-white/95">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span>Code<span className="text-emerald-400">Aurora</span></span>
              </Link>
            </div>

            {/* Middle: Rotating Showcase Slide */}
            <div className="my-auto max-w-md space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {/* Icon Wrapper */}
                  <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-md">
                    {(() => {
                      const SlideIcon = showcaseSlides[activeSlide].icon;
                      return <SlideIcon className="h-6 w-6" />;
                    })()}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-white">{showcaseSlides[activeSlide].title}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{showcaseSlides[activeSlide].description}</p>
                  </div>

                  {/* Visual UI Box Mockup */}
                  <div className="pt-2">
                    {showcaseSlides[activeSlide].visual}
                  </div>

                  {/* Stat Counter */}
                  <div className="pt-2 border-t border-white/5 flex gap-4">
                    <div>
                      <div className="text-3xl font-extrabold text-white tracking-tight">{showcaseSlides[activeSlide].statVal}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">{showcaseSlides[activeSlide].statLabel}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Dots */}
              <div className="flex gap-2.5 pt-4">
                {showcaseSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20"}`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Footer Trust Badge */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Legit & secure code reviews
              </span>
              <span>v2.0 Beta</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean, Premium Auth Form Card */}
        <div className="w-full lg:w-[52%] flex items-center justify-center p-6 sm:p-12 relative">
          
          {/* Mobile Back Button to Landing */}
          <div className="absolute top-8 left-6 sm:left-12 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Link>
          </div>

          <div className="w-full max-w-[420px] space-y-6">
            
            {/* Branding for Mobile */}
            <div className="lg:hidden text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <span>Code<span className="text-primary">Aurora</span></span>
              </Link>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-gray-200/50 dark:border-slate-800/50 bg-card/75 backdrop-blur-xl p-8 sm:p-10 shadow-xl shadow-black/[0.03] dark:shadow-black/[0.2] space-y-6"
            >
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-none tracking-tight text-card-foreground">{current.title}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">{current.subtitle}</p>
              </div>

              {/* Feedback Alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs"
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === "reset" ? (
                // PASSWORD RESET FORM
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="resetEmail" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resetEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="h-11 pl-10 rounded-xl border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 mt-2">
                    {loading ? "Sending..." : (
                      <>
                        <span>{current.submitText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline w-full pt-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                  </button>
                </form>
              ) : (
                // SIGN IN & SIGN UP FORM
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  
                  {/* Name Input (Signup only) */}
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          required
                          className="h-11 pl-10 rounded-xl border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="h-11 pl-10 rounded-xl border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => switchMode("reset")}
                          className="text-xs font-semibold text-primary hover:text-primary/95 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={mode === "signup" ? 8 : 6}
                        className="h-11 pl-10 pr-10 rounded-xl border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input (Signup only) */}
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Confirm password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          className="h-11 pl-10 pr-10 rounded-xl border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remember Me Checkbox (Signin only) */}
                  {mode === "signin" && (
                    <div className="flex items-center gap-2.5 pt-1">
                      <Checkbox
                        id="remember"
                        checked={keepLoggedIn}
                        onCheckedChange={(checked) => setKeepLoggedIn(Boolean(checked))}
                        className="rounded-md border-gray-300 dark:border-slate-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <label htmlFor="remember" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                        Keep me signed in
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 mt-4">
                    {loading ? "Please wait..." : (
                      <>
                        <span>{current.submitText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Switch Auth Mode Links */}
                  <div className="pt-2 text-center text-xs text-muted-foreground">
                    {mode === "signin" ? (
                      <p>
                        New to CodeAurora?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("signup")}
                          className="font-bold text-primary hover:underline"
                        >
                          Create an account
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("signin")}
                          className="font-bold text-primary hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                </form>
              )}
            </motion.section>

            {/* Bottom mini note */}
            <div className="space-y-2 mt-4 px-4 text-center">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
                🛡️ CodeAurora Sentinel follows a Zero Human Code Access architecture. Repository analysis is automated and administrators cannot view source code, secrets, or business logic.
              </p>
              <p className="text-[9px] text-muted-foreground/45">
                By continuing, you agree to our Terms of Service and Privacy Policy. Secure by Design.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
