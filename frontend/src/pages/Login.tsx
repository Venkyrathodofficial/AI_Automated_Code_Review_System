import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Eye, EyeOff, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Login = () => {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "true");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
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
      if (!agreeTerms) {
        setError("Please agree to the Terms and Privacy Policy");
        setLoading(false);
        return;
      }
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

  const handleGoogleSignIn = async () => {
    setError(null);
    await signInWithGoogle();
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

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={switchMode} className="text-primary font-semibold hover:underline">
              Create account
            </button>
          </p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-4 text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border hover:bg-accent transition-colors">
            <Github className="h-5 w-5" />
          </button>
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

          <div className="flex items-start gap-2">
            <Checkbox 
              id="agreeTerms" 
              checked={agreeTerms} 
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              className="mt-0.5"
            />
            <label htmlFor="agreeTerms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
              I agree with <a href="#" className="text-primary underline">Terms</a> and <a href="#" className="text-primary underline">Privacy Policy</a>
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
            Create Account
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-4 text-muted-foreground">Or</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="mt-5 text-center">
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
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
