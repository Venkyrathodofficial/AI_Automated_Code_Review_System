import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const { user, signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! Check your email for a confirmation link, then sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
  };

  /* Decorative Panel with Green Theme */
  const DecorativePanel = ({ title }: { title: string }) => (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-emerald-700">
      {/* Abstract Light Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-300/30 to-teal-400/30 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-green-300/30 to-emerald-400/30 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-teal-300/20 to-green-400/20 blur-3xl rounded-full" />
        {/* Light Rays */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-emerald-300/50 via-transparent to-transparent rotate-12" />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-green-300/50 via-transparent to-transparent -rotate-12" />
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-teal-300/50 via-transparent to-transparent rotate-6" />
        </div>
      </div>

      {/* Logo & Branding */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="hidden md:block">
          <p className="text-white font-bold text-sm">CodeAurora</p>
          <p className="text-white/70 text-xs">Sentinel AI</p>
        </div>
      </div>

      {/* Title */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            {title.split(" ").map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h2>
          <p className="mt-4 text-white/80 text-sm max-w-xs mx-auto">
            Secure every commit with AI-powered code review
          </p>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/60 text-xs">Powered by Advanced AI Technology</p>
      </div>
    </div>
  );

  /* Login Form */
  const LoginForm = () => (
    <div className="h-full flex flex-col justify-center p-8 md:p-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Mobile Logo */}
        <div className="flex items-center gap-3 mb-8 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-foreground">CodeAurora Sentinel</span>
            <p className="text-xs text-primary font-medium">AI Code Review</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-8">Please enter your login details to log in.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Email Address</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="mt-1.5 h-11 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              <button type="button" className="text-xs text-primary hover:underline font-medium">
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-11 pr-10 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox 
              id="keepLoggedIn" 
              checked={keepLoggedIn} 
              onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
            />
            <label htmlFor="keepLoggedIn" className="text-xs text-muted-foreground cursor-pointer">
              Keep me logged in
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 text-destructive text-xs p-3 border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-success/10 text-success text-xs p-3 border border-success/20">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl font-semibold" 
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Log in
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={switchMode} className="text-primary font-semibold hover:underline">
              Create account
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  /* Sign Up Form */
  const SignUpForm = () => (
    <div className="h-full flex flex-col justify-center p-8 md:p-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Mobile Logo */}
        <div className="flex items-center gap-3 mb-8 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-foreground">CodeAurora Sentinel</span>
            <p className="text-xs text-primary font-medium">AI Code Review</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">First name</Label>
              <Input
                type="text"
                placeholder="First name"
                className="mt-1.5 h-11 rounded-xl text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Last name</Label>
              <Input
                type="text"
                placeholder="Last name"
                className="mt-1.5 h-11 rounded-xl text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="mt-1.5 h-11 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              <span className="text-xs text-muted-foreground">min 8 characters</span>
            </div>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                className="h-11 pr-10 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 text-destructive text-xs p-3 border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-success/10 text-success text-xs p-3 border border-success/20">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl font-semibold" 
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <button onClick={switchMode} className="text-primary font-semibold hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      {/* Back to home */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <ShieldCheck className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium hidden sm:inline">CodeAurora Sentinel AI</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
      >
        <div className="relative h-[620px] md:h-[650px]">
          {/* Sliding Container */}
          <AnimatePresence mode="wait">
            {!isSignUp ? (
              <motion.div
                key="login"
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
                className="absolute inset-0 flex flex-col md:flex-row"
              >
                <div className="flex-1 order-2 md:order-1 bg-card">
                  <LoginForm />
                </div>
                <div className="h-32 md:h-auto md:flex-1 order-1 md:order-2 p-2">
                  <DecorativePanel title="Welcome back!" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.8 }}
                className="absolute inset-0 flex flex-col md:flex-row"
              >
                <div className="h-32 md:h-auto md:flex-1 order-1 p-2">
                  <DecorativePanel title="Let's Get Started!" />
                </div>
                <div className="flex-1 order-2 bg-card">
                  <SignUpForm />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom branding */}
      <div className="absolute bottom-4 text-center">
        <p className="text-xs text-muted-foreground">
          Secured by Supabase • © 2026 CodeAurora Sentinel AI
        </p>
      </div>
    </div>
  );
};

export default Login;
