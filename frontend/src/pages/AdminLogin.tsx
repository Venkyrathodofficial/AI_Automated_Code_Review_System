import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/adminApi";

const AdminLogin = () => {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // If already logged in, check admin status and redirect
  if (user && !checkingAdmin && !adminVerified && !error) {
    setCheckingAdmin(true);
    checkIsAdmin().then(({ isAdmin }) => {
      if (isAdmin) {
        setAdminVerified(true);
      } else {
        setError("This account does not have admin access.");
      }
      setCheckingAdmin(false);
    });
  }

  if (adminVerified) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // After login, verify admin status
    try {
      const { isAdmin } = await checkIsAdmin();
      if (isAdmin) {
        setAdminVerified(true);
      } else {
        setError("Access denied. This account is not an administrator.");
      }
    } catch {
      setError("Failed to verify admin status.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-red-500/5 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20 mb-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Admin Panel</h1>
          <p className="text-xs font-medium text-red-500 mt-1 tracking-wide">Restricted Access</p>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with your admin credentials
          </p>
        </div>

        {/* Back to home */}
        <div className="mb-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Home
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Security notice */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              This area is restricted to authorized administrators only.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Admin Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  className="h-11 pl-10 text-sm rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pl-10 pr-10 text-sm rounded-xl"
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

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs p-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm rounded-xl font-semibold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              disabled={loading || checkingAdmin}
            >
              {(loading || checkingAdmin) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {checkingAdmin ? "Verifying Admin Access..." : "Sign In as Admin"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Not an admin? Sign in as a regular user →
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6">
          Admin access is verified against the admin_users database
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
