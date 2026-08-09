import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  GitFork,
  FileSearch,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Bell,
  BellOff,
  Power,
  PowerOff,
  Loader2,
  UserPlus,
  LogIn,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  Megaphone,
  Construction,
  LayoutDashboard,
  Settings,
  TrendingUp,
  BarChart3,
  Search,
  ChevronRight,
  Eye,
  Activity,
  Key,
  Lock,
  Save,
  Filter,
  ChevronDown,
  ExternalLink,
  Trash2,
  MoreHorizontal,
  Calendar,
  Globe,
  Code,
  FileCode,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminDashboard, useUpdateAdminSettings } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { AdminRepository, AdminIssue, AdminUser, ActivityEntry, PromoCode, fetchPromoCodes, createPromoCode, deletePromoCode, togglePromoCode, fetchAiUsage, AiUsageSummary, AdminCategoryBreakdown } from "@/lib/adminApi";
import { formatDistanceToNow, format } from "date-fns";

type ActiveView = "dashboard" | "users" | "repositories" | "issues" | "activity" | "promo_codes" | "ai_usage" | "settings";

/* ── Animation variants ── */
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/* ── Sidebar Navigation Item ── */
function NavItem({ 
  icon: Icon, 
  label, 
  active = false,
  badge,
  onClick,
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
          ? "bg-primary text-white shadow-md shadow-primary/20" 
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Stat Card Component ── */
function StatCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  delay = 0,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: "primary" | "blue" | "red" | "amber" | "emerald" | "violet";
  delay?: number;
  onClick?: () => void;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    red: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    violet: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      custom={delay}
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mini Stat for Signups/Logins ── */
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {total === 0 ? (
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
          ) : (
            data.map((item, idx) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;
              const rotation = currentAngle;
              currentAngle += (percentage / 100) * 360;
              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  transform={`rotate(${rotation} 50 50)`}
                  className="transition-all duration-500"
                />
              );
            })
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-gray-500">{item.value} · {total > 0 ? Math.round((item.value / total) * 100) : 0}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bar Chart ── */
function BarChart({ data, height = 160 }: { data: { date: string; count: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((day) => {
        const pct = (day.count / max) * 100;
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{day.count}</span>
            <div className="w-full relative" style={{ height: height - 50 }}>
              <div className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-primary" style={{ height: `${Math.max(pct, 3)}%` }} />
            </div>
            <span className="text-[10px] text-gray-500">{day.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Detail Modal ── */
function DetailModal({ 
  title, 
  isOpen, 
  onClose, 
  children 
}: { 
  title: string; 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <XCircle className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">{children}</div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ DASHBOARD VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function DashboardView({
  data,
  onNavigate,
}: {
  data: any;
  onNavigate: (view: ActiveView) => void;
}) {
  const {
    totalUsers, totalReviews, totalRepos, signupsToday, signups7d, signups30d,
    loginsToday, logins7d, logins30d, criticalIssues, mediumIssues, lowIssues,
    openIssues, resolvedIssues, reviewsByDay, billingSummary = {
      mrrEstimate: 0,
      activePaidSubscribers: 0,
      freeSubscribers: 0,
      basicSubscribers: 0,
      startupSubscribers: 0,
      enterpriseSubscribers: 0,
    }
  } = data;

  const donutData = [
    { label: "Critical", value: criticalIssues, color: "#EF4444" },
    { label: "Medium", value: mediumIssues, color: "#F59E0B" },
    { label: "Low", value: lowIssues, color: "#22C55E" },
  ];

  return (
    <div className="space-y-8">
      {/* ── SaaS Revenue & Analytics ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            SaaS Revenue & Analytics
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Estimated MRR" 
            value={`₹${billingSummary.mrrEstimate.toLocaleString()}`} 
            icon={Globe} 
            color="emerald" 
            delay={0} 
          />
          <StatCard 
            title="Paid Subscribers" 
            value={billingSummary.activePaidSubscribers} 
            icon={Users} 
            color="blue" 
            delay={1} 
            onClick={() => onNavigate("users")}
          />
          <StatCard 
            title="Active Basic Tiers" 
            value={billingSummary.basicSubscribers} 
            icon={Shield} 
            color="violet" 
            delay={2} 
            onClick={() => onNavigate("users")}
          />
          <StatCard 
            title="Active Startup Tiers" 
            value={billingSummary.startupSubscribers} 
            icon={TrendingUp} 
            color="amber" 
            delay={3} 
            onClick={() => onNavigate("users")}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Platform Overview
          </h2>
          <span className="text-sm text-gray-500">
            {format(new Date(), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={totalUsers} icon={Users} color="primary" delay={0} onClick={() => onNavigate("users")} />
          <StatCard title="Total Reviews" value={totalReviews} icon={FileSearch} color="blue" delay={1} onClick={() => onNavigate("issues")} />
          <StatCard title="Repositories" value={totalRepos} icon={GitFork} color="violet" delay={2} onClick={() => onNavigate("repositories")} />
          <StatCard title="Open Issues" value={openIssues} icon={AlertCircle} color="amber" delay={3} onClick={() => onNavigate("issues")} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={4}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Signups</h3>
              <p className="text-xs text-gray-500">New registrations</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Today" value={signupsToday} />
            <MiniStat label="7 days" value={signups7d} />
            <MiniStat label="30 days" value={signups30d} />
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={5}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Logins</h3>
              <p className="text-xs text-gray-500">User activity</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MiniStat label="Today" value={loginsToday} />
            <MiniStat label="7 days" value={logins7d} />
            <MiniStat label="30 days" value={logins30d} />
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={6}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Issue Breakdown</h3>
              <p className="text-xs text-gray-500">By severity</p>
            </div>
            <button onClick={() => onNavigate("issues")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <DonutChart data={donutData} />
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={7}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Reviews — Last 7 Days</h3>
              <p className="text-xs text-gray-500">Daily activity</p>
            </div>
          </div>
          <BarChart data={reviewsByDay} height={180} />
        </motion.div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Issue Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard title="Critical" value={criticalIssues} icon={AlertTriangle} color="red" delay={8} />
          <StatCard title="Medium" value={mediumIssues} icon={AlertCircle} color="amber" delay={9} />
          <StatCard title="Low" value={lowIssues} icon={Info} color="emerald" delay={10} />
          <StatCard title="Open" value={openIssues} icon={Eye} color="amber" delay={11} />
          <StatCard title="Resolved" value={resolvedIssues} icon={CheckCircle2} color="emerald" delay={12} />
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ USERS VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function UsersView({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.email?.toLowerCase().includes(q) || u.id.includes(q));
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Plan</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Scans Used</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Provider</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Signed Up</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{(u.name || u.email || "U").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{u.name || "No Name"}</p>
                      <p className="text-xs text-gray-500 leading-normal">{u.email}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 leading-none">ID: {u.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                    u.planTier === "free" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
                    u.planTier === "basic" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
                    u.planTier === "startup" ? "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400" :
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}>
                    {u.planTier}
                    {u.planTier !== "free" && u.billingStatus !== "active" && (
                      <span className="text-[10px] text-red-500 ml-1">({u.billingStatus})</span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 max-w-[100px]">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {u.scansUsed || 0} / {u.scansLimit === 999999 ? "∞" : (u.scansLimit || 5)}
                    </span>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          (u.scansUsed || 0) >= (u.scansLimit || 5) ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(((u.scansUsed || 0) / (u.scansLimit || 5)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 capitalize">{u.provider}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : "—"}
                </td>
                <td className="px-6 py-4">
                  {u.emailConfirmed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setSelectedUser(u)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Eye className="h-4 w-4 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <DetailModal title="User Details" isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{(selectedUser.name || selectedUser.email || "U").charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{selectedUser.name || "No Name"}</h4>
                <p className="text-sm text-gray-500 leading-normal">{selectedUser.email}</p>
                <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Provider</p>
                <p className="font-medium capitalize">{selectedUser.provider}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Email Status</p>
                <p className="font-medium">{selectedUser.emailConfirmed ? "Verified" : "Pending"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Signed Up</p>
                <p className="font-medium text-sm">{selectedUser.createdAt ? format(new Date(selectedUser.createdAt), 'PPpp') : "Unknown"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Last Sign In</p>
                <p className="font-medium text-sm">{selectedUser.lastSignIn ? format(new Date(selectedUser.lastSignIn), 'PPpp') : "Never"}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Subscription & Quota Details</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Plan Tier</p>
                  <p className="font-medium capitalize flex items-center gap-1.5 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedUser.planTier === "free" ? "bg-gray-400" :
                      selectedUser.planTier === "basic" ? "bg-blue-500" :
                      selectedUser.planTier === "startup" ? "bg-violet-500" :
                      "bg-emerald-500"
                    }`} />
                    {selectedUser.planTier}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Payment Provider</p>
                  <p className="font-medium text-xs font-mono truncate capitalize" title={selectedUser.paymentProvider || "None"}>
                    {selectedUser.paymentProvider || "—"}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-500">Monthly Scans Used</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {selectedUser.scansUsed || 0} / {selectedUser.scansLimit === 999999 ? "∞" : (selectedUser.scansLimit || 5)}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        (selectedUser.scansUsed || 0) >= (selectedUser.scansLimit || 5) ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(((selectedUser.scansUsed || 0) / (selectedUser.scansLimit || 5)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Billing Status</p>
                  <p className="font-medium capitalize text-sm">{selectedUser.billingStatus || "—"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Period End / Renewal</p>
                  <p className="font-medium text-sm">
                    {selectedUser.periodEnd ? format(new Date(selectedUser.periodEnd), 'PP') : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ REPOSITORIES VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function RepositoriesView({ repositories, users }: { repositories: AdminRepository[]; users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<AdminRepository | null>(null);

  const getUserEmail = (userId: string) => users.find(u => u.id === userId)?.email || "Unknown";

  const filteredRepos = useMemo(() => {
    if (!search) return repositories;
    const q = search.toLowerCase();
    return repositories.filter(r => 
      r.id?.toLowerCase().includes(q)
    );
  }, [repositories, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Repositories</h2>
          <p className="text-sm text-gray-500">{repositories.length} connected repositories (Names masked for privacy)</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Repository ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepos.map((repo) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
            onClick={() => setSelectedRepo(repo)}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                  <GitFork className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  repo.is_connected 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800"
                }`}>
                  {repo.is_connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Private Repository</h4>
              <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-3 truncate">ID: {repo.id}</p>

              {/* Security Indicators */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  repo.security_grade === "A+" || repo.security_grade === "A" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" :
                  repo.security_grade === "B" || repo.security_grade === "C" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20" :
                  "bg-red-50 text-red-700 dark:bg-red-900/20"
                }`}>
                  Grade {repo.security_grade || "—"}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  repo.risk_level === "Low" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20" :
                  repo.risk_level === "Medium" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20" :
                  "bg-red-50 text-red-700 dark:bg-red-900/20"
                }`}>
                  {repo.risk_level || "—"} Risk
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Score: {repo.security_score !== null ? `${repo.security_score}%` : "—"}</span>
              </div>

              {/* Issue counts */}
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl mb-4 text-center text-[10px] text-gray-500">
                <div>
                  <p className="font-bold text-red-500 text-xs">{repo.critical_issues}</p>
                  <span>Crit/High</span>
                </div>
                <div>
                  <p className="font-bold text-amber-500 text-xs">{repo.medium_issues}</p>
                  <span>Medium</span>
                </div>
                <div>
                  <p className="font-bold text-emerald-500 text-xs">{repo.low_issues}</p>
                  <span>Low</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800/80 pt-3 mt-1">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{getUserEmail(repo.user_id)}</span>
            </div>
          </motion.div>
        ))}
        {filteredRepos.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">No repositories found</div>
        )}
      </div>

      <DetailModal title="Repository Details" isOpen={!!selectedRepo} onClose={() => setSelectedRepo(null)}>
        {selectedRepo && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                <GitFork className="h-7 w-7 text-violet-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Private Repository</h4>
                <p className="text-xs font-mono text-gray-500 truncate">ID: {selectedRepo.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Owner Email</p>
                <p className="font-medium text-sm truncate">{getUserEmail(selectedRepo.user_id)}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Scan Status</p>
                <p className="font-medium text-sm">{selectedRepo.is_connected ? "Scan Pipeline Active" : "Disconnected"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Security Score & Grade</p>
                <p className="font-medium text-sm">{selectedRepo.security_score !== null ? `${selectedRepo.security_score}% (Grade ${selectedRepo.security_grade})` : "No scans performed yet"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Risk Level</p>
                <p className="font-medium text-sm">{selectedRepo.risk_level || "—"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Connected On</p>
                <p className="font-medium text-sm">{selectedRepo.created_at ? format(new Date(selectedRepo.created_at), 'PP') : "Unknown"}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Last Scan Date</p>
                <p className="font-medium text-sm">{selectedRepo.last_scan_at ? format(new Date(selectedRepo.last_scan_at), 'PP') : "Never"}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Issue Summary Stats</h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-xl text-center">
                  <p className="text-2xl font-black text-red-600">{selectedRepo.critical_issues}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Critical/High</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl text-center">
                  <p className="text-2xl font-black text-amber-600">{selectedRepo.medium_issues}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Medium</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl text-center">
                  <p className="text-2xl font-black text-emerald-600">{selectedRepo.low_issues}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Low</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ ISSUES VIEW (Aggregated Vulnerability Category View)
   ══════════════════════════════════════════════════════════════════════════════ */
function IssuesView({ categoryBreakdown }: { categoryBreakdown: AdminCategoryBreakdown[] }) {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search) return categoryBreakdown;
    const q = search.toLowerCase();
    return categoryBreakdown.filter(c => c.category?.toLowerCase().includes(q));
  }, [categoryBreakdown, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Issues</h2>
          <p className="text-sm text-gray-500">{categoryBreakdown.length} vulnerability categories identified</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Vulnerability Category</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total Findings</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Open</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Resolved</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Critical/High</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Medium</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCategories.map((c) => (
                <tr key={c.category} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {c.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-center font-bold text-gray-600 dark:text-gray-400">
                    {c.total}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-semibold">
                      {c.open}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                      {c.resolved}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-red-600">
                    {c.critical + c.high}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-amber-600">
                    {c.medium}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-emerald-600">
                    {c.low}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ ACTIVITY VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function ActivityView({ activities }: { activities: ActivityEntry[] }) {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivities = useMemo(() => {
    if (filter === "all") return activities;
    return activities.filter(a => a.event_type === filter);
  }, [activities, filter]);

  const eventStyles: Record<string, { bg: string; icon: React.ElementType }> = {
    signup: { bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", icon: UserPlus },
    login: { bg: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: LogIn },
    logout: { bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Power },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Log</h2>
          <p className="text-sm text-gray-500">{activities.length} recorded events</p>
        </div>
        <div className="flex gap-2">
          {["all", "signup", "login", "logout"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f 
                  ? "bg-primary text-white" 
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Event</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredActivities.map((a) => {
                const style = eventStyles[a.event_type] || { bg: "bg-gray-100", icon: Activity };
                const Icon = style.icon;
                return (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${style.bg}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {a.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{a.email || "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">{a.ip_address || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                );
              })}
              {filteredActivities.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No activity found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ SETTINGS VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function SettingsView({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings: any;
}) {
  const [maintenanceMsg, setMaintenanceMsg] = useState(settings.maintenance_message || "");
  const [noticeMsg, setNoticeMsg] = useState(settings.notice_message || "");
  const [noticeType, setNoticeType] = useState<"info" | "warning" | "critical">(settings.notice_type || "info");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const isMaintenanceOn = settings.maintenance_mode;
  const isNoticeOn = settings.notice_enabled;

  const handleToggleMaintenance = () => {
    updateSettings.mutate({
      maintenance_mode: !isMaintenanceOn,
      maintenance_message: maintenanceMsg,
    });
  };

  const handleSaveMaintenance = () => {
    updateSettings.mutate({ maintenance_message: maintenanceMsg });
  };

  const handleToggleNotice = () => {
    updateSettings.mutate({
      notice_enabled: !isNoticeOn,
      notice_message: noticeMsg,
      notice_type: noticeType,
    });
  };

  const handleSaveNotice = () => {
    updateSettings.mutate({
      notice_message: noticeMsg,
      notice_type: noticeType,
    });
  };

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess("");
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Note: Actual password change would require backend implementation
    setPasswordSuccess("Password change functionality requires backend implementation");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Settings</h2>
        <p className="text-sm text-gray-500">Manage system settings and controls</p>
      </div>

      {/* Maintenance Mode */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isMaintenanceOn ? "bg-red-100 dark:bg-red-900/20" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Construction className={`h-6 w-6 ${isMaintenanceOn ? "text-red-600" : "text-gray-500"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Mode</h3>
              <p className="text-sm text-gray-500">Block user access during maintenance</p>
            </div>
          </div>
          <Button
            variant={isMaintenanceOn ? "destructive" : "outline"}
            className="rounded-xl gap-2"
            onClick={handleToggleMaintenance}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isMaintenanceOn ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            {isMaintenanceOn ? "Turn OFF" : "Turn ON"}
          </Button>
        </div>
        
        <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${
          isMaintenanceOn 
            ? "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400" 
            : "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
        }`}>
          <span className="font-medium">Status:</span> {isMaintenanceOn ? "Active — Users cannot access" : "Inactive — Site operational"}
        </div>

        <div className="space-y-3">
          <Label>Maintenance Message</Label>
          <textarea
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm resize-none h-24"
            value={maintenanceMsg}
            onChange={(e) => setMaintenanceMsg(e.target.value)}
            placeholder="Message shown during maintenance..."
          />
          <Button variant="outline" className="rounded-xl" onClick={handleSaveMaintenance} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save Message
          </Button>
        </div>
      </section>

      {/* Notice Banner */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isNoticeOn ? "bg-blue-100 dark:bg-blue-900/20" : "bg-gray-100 dark:bg-gray-800"
            }`}>
              <Megaphone className={`h-6 w-6 ${isNoticeOn ? "text-blue-600" : "text-gray-500"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Notice Banner</h3>
              <p className="text-sm text-gray-500">Display announcements to users</p>
            </div>
          </div>
          <Button
            variant={isNoticeOn ? "destructive" : "outline"}
            className="rounded-xl gap-2"
            onClick={handleToggleNotice}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isNoticeOn ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {isNoticeOn ? "Hide Banner" : "Show Banner"}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Notice Message</Label>
            <Input
              className="mt-2 rounded-xl"
              value={noticeMsg}
              onChange={(e) => setNoticeMsg(e.target.value)}
              placeholder="Enter announcement message..."
            />
          </div>
          
          <div>
            <Label>Notice Type</Label>
            <div className="flex gap-2 mt-2">
              {(["info", "warning", "critical"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNoticeType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    noticeType === t
                      ? t === "info"
                        ? "bg-blue-100 border-blue-200 text-blue-700"
                        : t === "warning"
                        ? "bg-amber-100 border-amber-200 text-amber-700"
                        : "bg-red-100 border-red-200 text-red-700"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <Button variant="outline" className="rounded-xl" onClick={handleSaveNotice} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" /> Save Notice
          </Button>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
            <Key className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Change Admin Password</h3>
            <p className="text-sm text-gray-500">Update your admin credentials</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                className="pl-10 rounded-xl"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
          </div>
          
          <div>
            <Label>New Password</Label>
            <div className="relative mt-2">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                className="pl-10 rounded-xl"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
              />
            </div>
          </div>
          
          <div>
            <Label>Confirm New Password</Label>
            <div className="relative mt-2">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                className="pl-10 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {passwordError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4" /> {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {passwordSuccess}
            </div>
          )}
          
          <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleChangePassword}>
            <Lock className="h-4 w-4 mr-2" /> Change Password
          </Button>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ PROMO CODES VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function PromoCodesView() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("basic");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newExpiry, setNewExpiry] = useState("2026-12-31");
  const [newNotes, setNewNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToastMsg] = useState("");

  const reload = async () => {
    try {
      setLoading(true);
      const data = await fetchPromoCodes();
      setCodes(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    try {
      setCreating(true);
      await createPromoCode({ code: newCode, plan: newPlan, maxUses: parseInt(newMaxUses), expiresAt: newExpiry, notes: newNotes });
      setNewCode(""); setNewNotes("");
      setToastMsg("Code created!");
      await reload();
    } catch (e: any) { setToastMsg(e.message); }
    finally { setCreating(false); setTimeout(() => setToastMsg(""), 3000); }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Delete code "${code}"?`)) return;
    try { await deletePromoCode(code); await reload(); } catch {}
  };

  const handleToggle = async (code: string, current: boolean) => {
    try { await togglePromoCode(code, !current); await reload(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Promo Codes</h2>
          <p className="text-sm text-gray-500">{codes.length} total codes</p>
        </div>
      </div>

      {toast && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">{toast}</div>
      )}

      {/* Create Form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Code</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Code (auto-uppercase)</Label>
            <Input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="MYCODE2026" className="mt-1 rounded-xl font-mono" />
          </div>
          <div>
            <Label className="text-xs">Plan</Label>
            <select value={newPlan} onChange={e => setNewPlan(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-background text-sm">
              <option value="basic">basic</option>
              <option value="beta">Pro</option>
              <option value="admin">custom</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Max Uses</Label>
            <Input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">Expires At</Label>
            <Input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div className="col-span-2 lg:col-span-2">
            <Label className="text-xs">Notes</Label>
            <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. Prompt Wars 2026" className="mt-1 rounded-xl" />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating || !newCode.trim()} className="mt-4 rounded-xl">
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
          Create Code
        </Button>
      </div>

      {/* Codes Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {["Code", "Plan", "Used/Max", "Expires", "Status", "Notes", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-4 font-mono text-sm font-bold text-primary">{c.code}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold transition-all ${
                        c.plan === "admin" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800" :
                        c.plan === "beta" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" :
                        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      }`}>
                        {c.plan === "admin" ? "custom" : c.plan === "beta" ? "Pro" : "basic"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{c.used_count} / {c.max_uses}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(c.code, c.is_active)} className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${ c.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200" }`}>
                        {c.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 max-w-[160px] truncate">{c.notes || "—"}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleDelete(c.code)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No promo codes yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ███ AI USAGE VIEW
   ══════════════════════════════════════════════════════════════════════════════ */
function AiUsageView() {
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAiUsage().then(setUsage).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!usage) return <div className="p-12 text-center text-gray-500">Failed to load AI usage data.</div>;

  const monthPct = usage.monthlyBudgetUsd > 0 ? Math.min(100, (usage.monthlyCostUsd / usage.monthlyBudgetUsd) * 100) : 0;
  const dayPct = usage.dailyBudgetUsd > 0 ? Math.min(100, (usage.dailyCostUsd / usage.dailyBudgetUsd) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Usage & Budget</h2>
        <p className="text-sm text-gray-500">Gemini 2.5 Flash cost monitoring — current calendar month</p>
      </div>

      {usage.budgetExceeded && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-semibold">⚠️ AI budget limit exceeded — new scans are blocked until next reset.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Monthly Cost" value={`$${usage.monthlyCostUsd.toFixed(4)}`} icon={TrendingUp} color="emerald" />
        <StatCard title="Daily Cost" value={`$${usage.dailyCostUsd.toFixed(4)}`} icon={Activity} color="blue" />
        <StatCard title="Total Requests" value={usage.totalRequests} icon={FileSearch} color="violet" />
        <StatCard title="Tokens Estimated" value={usage.totalTokens.toLocaleString()} icon={BarChart3} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Budget</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Used: ${usage.monthlyCostUsd.toFixed(4)}</span>
              <span className="font-semibold">/ ${usage.monthlyBudgetUsd}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${ monthPct >= 100 ? "bg-red-500" : monthPct >= 80 ? "bg-amber-500" : "bg-emerald-500" }`} style={{ width: `${monthPct}%` }} />
            </div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white pt-2">Daily Budget</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Used: ${usage.dailyCostUsd.toFixed(4)}</span>
              <span className="font-semibold">/ ${usage.dailyBudgetUsd}</span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${ dayPct >= 100 ? "bg-red-500" : dayPct >= 80 ? "bg-amber-500" : "bg-emerald-500" }`} style={{ width: `${dayPct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Users by Cost</h3>
          {usage.topUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No usage recorded this month.</p>
          ) : (
            <div className="space-y-3">
              {usage.topUsers.map((u, i) => (
                <div key={u.user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                    <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{u.user_id.substring(0, 16)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">${u.total_cost.toFixed(5)}</p>
                    <p className="text-xs text-gray-500">{u.total_requests} req</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const AdminDashboard = () => {
  const { data, isLoading, error } = useAdminDashboard();
  const updateSettings = useUpdateAdminSettings();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const { signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have permission to access the admin panel.</p>
          <a href="/admin/login">
            <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
              <Shield className="h-4 w-4" /> Admin Login
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalUsers, totalRepos, openIssues, users, repositories = [], categoryBreakdown = [], recentActivity, settings } = data;

  const viewTitles: Record<ActiveView, string> = {
    dashboard: "Dashboard",
    users: "Users",
    repositories: "Repositories",
    issues: "Issues",
    activity: "Activity",
    promo_codes: "Promo Codes",
    ai_usage: "AI Usage & Budget",
    settings: "Settings",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">Admin Panel</h1>
              <p className="text-xs text-gray-500">CodeAurora Sentinel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
          <NavItem icon={Users} label="Users" badge={totalUsers} active={activeView === "users"} onClick={() => setActiveView("users")} />
          <NavItem icon={GitFork} label="Repositories" badge={totalRepos} active={activeView === "repositories"} onClick={() => setActiveView("repositories")} />
          <NavItem icon={AlertTriangle} label="Issues" badge={openIssues} active={activeView === "issues"} onClick={() => setActiveView("issues")} />
          <NavItem icon={Activity} label="Activity" active={activeView === "activity"} onClick={() => setActiveView("activity")} />
          <div className="border-t border-gray-100 dark:border-gray-800 my-2 pt-2">
            <p className="text-[10px] uppercase font-bold text-gray-400 px-4 mb-1">Beta</p>
            <NavItem icon={Key} label="Promo Codes" active={activeView === "promo_codes"} onClick={() => setActiveView("promo_codes")} />
            <NavItem icon={TrendingUp} label="AI Usage" active={activeView === "ai_usage"} onClick={() => setActiveView("ai_usage")} />
          </div>
          <NavItem icon={Settings} label="Settings" active={activeView === "settings"} onClick={() => setActiveView("settings")} />
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{viewTitles[activeView]}</h1>
              <p className="text-sm text-gray-500">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={async () => { await signOut(); window.location.href = "/admin/login"; }}
              >
                <Power className="h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeView} {...pageTransition}>
              {activeView === "dashboard" && <DashboardView data={data} onNavigate={setActiveView} />}
              {activeView === "users" && <UsersView users={users} />}
              {activeView === "repositories" && <RepositoriesView repositories={repositories} users={users} />}
              {activeView === "issues" && <IssuesView categoryBreakdown={categoryBreakdown} />}
              {activeView === "activity" && <ActivityView activities={recentActivity} />}
              {activeView === "promo_codes" && <PromoCodesView />}
              {activeView === "ai_usage" && <AiUsageView />}
              {activeView === "settings" && <SettingsView settings={settings} updateSettings={updateSettings} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
