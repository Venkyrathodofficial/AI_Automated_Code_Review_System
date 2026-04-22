import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Monitor,
  Shield,
  UserRoundPlus,
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
    title: "Sign in",
    subtitle: "Enter your details to continue to your account.",
    submitText: "Sign in",
    panelTitle: "Welcome back",
  },
  signup: {
    title: "Sign up",
    subtitle: "Create your account and start secure code reviews.",
    submitText: "Sign up",
    panelTitle: "Create account",
  },
  reset: {
    title: "Reset password",
    subtitle: "Enter your email and we will send your reset link.",
    submitText: "Request reset link",
    panelTitle: "Recover access",
  },
};

function AuthArtwork({ mode }: { mode: AuthMode }) {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative h-72 w-full rounded-[42px] bg-gradient-to-b from-primary/5 via-primary/10 to-transparent">
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-card/55" />

        {mode === "signin" && (
          <>
            <div className="absolute left-1/2 top-1/2 h-28 w-24 -translate-x-1/2 -translate-y-1/2 rounded-t-[60px] bg-primary/85" />
            <div className="absolute left-1/2 top-[56%] h-14 w-20 -translate-x-1/2 rounded-2xl bg-primary/20" />
            <div className="absolute left-1/2 top-[61%] flex h-14 w-20 -translate-x-1/2 items-center justify-center rounded-xl border border-primary/20 bg-card shadow-sm">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute left-[30%] top-[72%] h-8 w-8 rounded-2xl bg-primary/20" />
          </>
        )}

        {mode === "signup" && (
          <>
            <div className="absolute left-[36%] top-[46%] h-24 w-20 -translate-x-1/2 -translate-y-1/2 rounded-t-[48px] bg-primary/80" />
            <div className="absolute left-[58%] top-[56%] h-16 w-24 -translate-x-1/2 rounded-xl border border-primary/25 bg-card shadow-sm" />
            <div className="absolute left-[58%] top-[61%] h-1.5 w-16 -translate-x-1/2 rounded-full bg-primary/30" />
            <div className="absolute left-[58%] top-[66%] h-1.5 w-12 -translate-x-1/2 rounded-full bg-primary/25" />
            <div className="absolute left-[27%] top-[76%] h-8 w-8 rounded-2xl bg-primary/20" />
            <div className="absolute left-[70%] top-[76%] h-8 w-8 rounded-2xl bg-primary/20" />
            <div className="absolute left-[53%] top-[40%] flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-card">
              <UserRoundPlus className="h-4 w-4 text-primary" />
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <div className="absolute left-[40%] top-[48%] h-24 w-20 -translate-x-1/2 -translate-y-1/2 rounded-t-[48px] bg-primary/82" />
            <div className="absolute left-[58%] top-[58%] flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-2xl border border-primary/25 bg-card shadow-sm">
              <Shield className="h-9 w-9 text-primary" />
            </div>
            <div className="absolute left-[58%] top-[56%] flex h-6 w-6 translate-x-3 translate-y-7 items-center justify-center rounded-full border border-primary/30 bg-background">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="absolute left-[30%] top-[75%] h-8 w-8 rounded-2xl bg-primary/20" />
          </>
        )}
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen overflow-hidden bg-[#eef1f2] px-4 py-7 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-4 top-20 h-4 w-4 rotate-12 rounded-sm bg-primary/10" />
        <div className="absolute left-[20%] top-[15%] h-5 w-5 rotate-12 rounded-sm bg-primary/10" />
        <div className="absolute right-[18%] top-[20%] h-6 w-6 rotate-12 rounded-sm border border-primary/20" />
        <div className="absolute left-[8%] bottom-[22%] h-7 w-7 rotate-12 rounded-sm bg-primary/10" />
        <div className="absolute right-[12%] bottom-[14%] h-4 w-4 rotate-12 rounded-sm bg-primary/10" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-[28px] font-bold tracking-tight text-foreground/90">
          <span className="text-primary">Code</span>Aurora
        </Link>

        <div className="mt-5 grid items-center gap-6 lg:grid-cols-[1.15fr_420px]">
          <motion.section
            key={mode}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-[28px]"
          >
            <div className="px-2 pb-3 pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary/75">{current.panelTitle}</p>
              <AuthArtwork mode={mode} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-[26px] border border-border/60 bg-card px-6 py-7 shadow-lg shadow-black/5 sm:px-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-[34px] font-bold leading-none tracking-tight">{current.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>

                {mode === "reset" ? (
                  <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="resetEmail" className="text-xs font-semibold text-muted-foreground">
                        Email address
                      </Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="mt-1.5 h-11 rounded-lg border-border bg-muted/35"
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                        {success}
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="h-11 w-full rounded-full font-semibold">
                      {loading ? "Sending..." : current.submitText}
                    </Button>

                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Login screen
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                    <div>
                      {mode === "signup" && (
                        <div className="mb-4">
                          <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                            Name
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name"
                            required
                            className="mt-1.5 h-11 rounded-lg border-border bg-muted/35"
                          />
                        </div>
                      )}

                      <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="mt-1.5 h-11 rounded-lg border-border bg-muted/35"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
                          Password
                        </Label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={() => switchMode("reset")}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          required
                          minLength={mode === "signup" ? 8 : 6}
                          className="h-11 rounded-lg border-border bg-muted/35 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {mode === "signup" && (
                      <>
                        <div>
                          <Label htmlFor="confirmPassword" className="text-xs font-semibold text-muted-foreground">
                            Confirm password
                          </Label>
                          <div className="relative mt-1.5">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm password"
                              required
                              minLength={8}
                              className="h-11 rounded-lg border-border bg-muted/35 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                      </>
                    )}

                    {mode === "signin" && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <Checkbox
                          id="remember"
                          checked={keepLoggedIn}
                          onCheckedChange={(checked) => setKeepLoggedIn(Boolean(checked))}
                        />
                        <label htmlFor="remember" className="text-xs text-muted-foreground">
                          Remember me
                        </label>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                        {success}
                      </div>
                    )}

                    <Button type="submit" disabled={loading} className="h-11 w-full rounded-full font-semibold">
                      {loading ? "Please wait..." : current.submitText}
                    </Button>

                    {mode === "signin" ? (
                      <p className="text-center text-xs text-muted-foreground">
                        Not Registered yet?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("signup")}
                          className="font-semibold text-primary hover:underline"
                        >
                          Register
                        </button>
                      </p>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode("signin")}
                          className="font-semibold text-primary hover:underline"
                        >
                          Login
                        </button>
                      </p>
                    )}
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Login;
