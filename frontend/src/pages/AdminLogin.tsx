import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, ArrowLeft, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { checkIsAdmin } from "@/lib/adminApi";
import { SentinelLockLoader } from "@/components/SentinelLockLoader";

const AdminLogin = () => {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // If already logged in, check admin status and redirect safely inside useEffect
  useEffect(() => {
    if (user && !adminVerified && !error) {
      setCheckingAdmin(true);
      checkIsAdmin()
        .then(({ isAdmin }) => {
          if (isAdmin) {
            setAdminVerified(true);
            navigate("/admin", { replace: true });
          } else {
            setError("This account does not have admin access.");
          }
        })
        .catch(() => {
          setError("Failed to verify admin status.");
        })
        .finally(() => {
          setCheckingAdmin(false);
        });
    }
  }, [user, adminVerified, error, navigate]);

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
        navigate("/admin", { replace: true });
        return;
      } else {
        setError("Access denied. This account is not an administrator.");
      }
    } catch {
      setError("Failed to verify admin status.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060709] saas-unified-grid text-white px-4 relative overflow-hidden">
      {/* High-Tech Padlock Loading Overlay during Admin Verification */}
      {(loading || checkingAdmin) && (
        <SentinelLockLoader
          message="Verifying administrator clearance..."
          subMessage="Cross-referencing cryptographic clearance against admin_users registry"
        />
      )}

      {/* Soft Red Ambient Glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[340px] bg-red-600/10 rounded-full blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home Pill */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 backdrop-blur-md"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-red-400" /> Back to Home
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-400/80 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full">
            Restricted Zone
          </span>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl sm:rounded-3xl bg-[#0c0e14]/90 border border-white/10 p-5 xs:p-6 sm:p-8 md:p-9 shadow-2xl backdrop-blur-2xl overflow-hidden">
          {/* Glowing Red Accent Top Border */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

          {/* Logo & Title Header */}
          <div className="flex flex-col items-center mb-5 sm:mb-6 text-center">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 shadow-lg shadow-red-500/25 mb-3 border border-red-400/30">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Admin Console</h1>
            <p className="text-xs text-gray-400 mt-1">
              Mission control & operations telemetry authentication
            </p>
          </div>

          {/* Security notice */}
          <div className="flex items-center gap-2 rounded-xl bg-amber-950/30 border border-amber-800/40 px-3 sm:px-3.5 py-2.5 mb-4 sm:mb-5 text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-[10px] sm:text-[11px] leading-relaxed">
              Authorized personnel only. Sessions and access attempts are cryptographically audited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Admin Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  className="h-11 pl-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500 text-base sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Master Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pl-10 pr-10 rounded-xl bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:border-red-500 focus-visible:ring-1 focus-visible:ring-red-500 text-base sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs p-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-sm rounded-full font-extrabold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-600/20 transition-all mt-4"
              disabled={loading || checkingAdmin}
            >
              {(loading || checkingAdmin) && <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />}
              {checkingAdmin ? "Verifying Admin Privileges..." : "Sign In to Admin Console"}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
            >
              Not an admin? Sign in as a regular user →
            </Link>
          </div>
        </div>

        <p className="text-[10px] text-gray-500 text-center mt-5">
          Role verification enforced via Supabase RBAC • Protected Endpoint
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
