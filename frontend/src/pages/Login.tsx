import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff, User, Check } from "lucide-react";
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

  /* Decorative Panel Component */
  const DecorativePanel = ({ title }: { title: string }) => (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f4e] via-[#2d3a8c] to-[#1a237e]">
      {/* Abstract Light Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-pink-500/30 to-purple-500/30 blur-3xl rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-orange-400/20 to-pink-500/20 blur-3xl rounded-full" />
        {/* Light Rays */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/3 w-1 h-full bg-gradient-to-b from-cyan-400/50 via-transparent to-transparent rotate-12" />
          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-pink-400/50 via-transparent to-transparent -rotate-12" />
          <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-purple-400/50 via-transparent to-transparent rotate-6" />
        </div>
      </div>

      {/* Logo */}
      <div className="absolute top-6 left-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Title */}
      <div className="absolute inset-0 flex items-center justify-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center leading-tight drop-shadow-lg">
          {title.split(" ").map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h2>
      </div>
    </div>
  );

  /* Login Form */
  const LoginForm = () => (
    <div className="h-full flex flex-col justify-center p-8 md:p-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Logo for mobile */}
        <div className="flex items-center gap-3 mb-8 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">CodeAurora Sentinel</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login</h1>
        <p className="text-sm text-gray-500 mb-8">Please enter your login details to log in.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Email Address</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="mt-1.5 h-11 rounded-lg border-gray-200 dark:border-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Password</Label>
              <button type="button" className="text-xs text-[#3348A2] hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-11 pr-10 rounded-lg border-gray-200 dark:border-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="border-gray-300"
            />
            <label htmlFor="keepLoggedIn" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              Keep me logged in
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs p-3">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-lg font-semibold bg-[#3348A2] hover:bg-[#2a3d8a]" 
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Log in
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{" "}
            <button onClick={switchMode} className="text-[#3348A2] font-semibold hover:underline">
              Create account
            </button>
          </p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-900 px-4 text-gray-500">or continue with</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            type="button"
            onClick={handleGoogleSignIn}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          </button>
          <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <svg className="h-5 w-5" fill="#1DA1F2" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  /* Sign Up Form */
  const SignUpForm = () => (
    <div className="h-full flex flex-col justify-center p-8 md:p-12">
      <div className="max-w-sm mx-auto w-full">
        {/* Logo for mobile */}
        <div className="flex items-center gap-3 mb-8 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">CodeAurora Sentinel</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">First name</Label>
              <Input
                type="text"
                placeholder="Enter your first name"
                className="mt-1.5 h-11 rounded-lg border-gray-200 dark:border-gray-700 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Last name</Label>
              <Input
                type="text"
                placeholder="Enter your last name"
                className="mt-1.5 h-11 rounded-lg border-gray-200 dark:border-gray-700 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Email</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="mt-1.5 h-11 rounded-lg border-gray-200 dark:border-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Password</Label>
              <span className="text-xs text-gray-400">min 8 characters</span>
            </div>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create password"
                className="h-11 pr-10 rounded-lg border-gray-200 dark:border-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              className="border-gray-300 mt-0.5"
            />
            <label htmlFor="agreeTerms" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed">
              I agree with <a href="#" className="text-[#3348A2] underline">Terms</a> and <a href="#" className="text-[#3348A2] underline">Privacy Policy</a>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs p-3">
              {success}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 rounded-lg font-semibold bg-[#3348A2] hover:bg-[#2a3d8a]" 
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Account
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-gray-900 px-4 text-gray-500">Or</span>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
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
          <p className="text-xs text-gray-500">
            Already have an account?{" "}
            <button onClick={switchMode} className="text-[#3348A2] font-semibold hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#8D9DD6] p-4 md:p-8">
      <Link 
        to="/" 
        className="absolute top-4 left-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
      >
        <ShieldCheck className="h-5 w-5" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="relative h-[600px] md:h-[650px]">
          {/* Sliding Container */}
          <div className="absolute inset-0 flex">
            {/* Login View: Form Left, Decorative Right */}
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
                  <div className="flex-1 order-2 md:order-1 bg-white dark:bg-gray-900">
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
                  <div className="flex-1 order-2 bg-white dark:bg-gray-900">
                    <SignUpForm />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
