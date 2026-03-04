import { useState } from "react";
import { motion } from "framer-motion";
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
  ArrowLeft,
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminDashboard, useUpdateAdminSettings } from "@/hooks/useAdmin";
import { formatDistanceToNow, format } from "date-fns";

/* ── Animation variants ── */
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

/* ── Sidebar Navigation Item ── */
function NavItem({ 
  icon: Icon, 
  label, 
  active = false,
  badge,
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
  badge?: number;
}) {
  return (
    <button
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
  trend,
  trendValue,
  color = "primary",
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "primary" | "blue" | "red" | "amber" | "emerald" | "violet";
  delay?: number;
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
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trendValue && (
            <p className={`text-xs font-medium flex items-center gap-1 ${
              trend === "up" ? "text-emerald-600" : "text-red-500"
            }`}>
              <TrendingUp className={`h-3 w-3 ${trend === "down" ? "rotate-180" : ""}`} />
              {trendValue}
            </p>
          )}
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

/* ── Progress Ring for Donut Chart ── */
function DonutChart({ 
  data 
}: { 
  data: { label: string; value: number; color: string }[] 
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {total === 0 ? (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
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
              <p className="text-xs text-gray-500">{item.value} issues · {total > 0 ? Math.round((item.value / total) * 100) : 0}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bar Chart Component ── */
function BarChart({ 
  data,
  height = 160,
}: { 
  data: { date: string; count: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((day) => {
        const pct = (day.count / max) * 100;
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{day.count}</span>
            <div className="w-full relative" style={{ height: height - 50 }}>
              <div 
                className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-300 bg-primary"
                style={{ height: `${Math.max(pct, 3)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500">{day.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Admin Dashboard Component ── */
const AdminDashboard = () => {
  const { data, isLoading, error } = useAdminDashboard();
  const updateSettings = useUpdateAdminSettings();

  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeType, setNoticeType] = useState<"info" | "warning" | "critical">("info");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "activity">("users");

  if (data?.settings && !settingsLoaded) {
    setMaintenanceMsg(data.settings.maintenance_message || "");
    setNoticeMsg(data.settings.notice_message || "");
    setNoticeType((data.settings.notice_type as "info" | "warning" | "critical") || "info");
    setSettingsLoaded(true);
  }

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
          <div className="flex items-center gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="outline" className="rounded-xl gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
                <Shield className="h-4 w-4" /> Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    totalUsers,
    totalReviews,
    totalRepos,
    signupsToday,
    signups7d,
    signups30d,
    loginsToday,
    logins7d,
    logins30d,
    criticalIssues,
    mediumIssues,
    lowIssues,
    openIssues,
    resolvedIssues,
    reviewsByDay,
    users,
    recentActivity,
    settings,
  } = data;

  const isMaintenanceOn = settings.maintenance_mode;
  const isNoticeOn = settings.notice_enabled;

  const handleToggleMaintenance = () => {
    updateSettings.mutate({
      maintenance_mode: !isMaintenanceOn,
      maintenance_message: maintenanceMsg,
    });
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

  const donutData = [
    { label: "Critical", value: criticalIssues, color: "#EF4444" },
    { label: "Medium", value: mediumIssues, color: "#F59E0B" },
    { label: "Low", value: lowIssues, color: "#22C55E" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col fixed h-full z-50">
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={Users} label="Users" badge={totalUsers} />
          <NavItem icon={GitFork} label="Repositories" badge={totalRepos} />
          <NavItem icon={AlertTriangle} label="Issues" badge={openIssues} />
          <NavItem icon={Activity} label="Activity" />
          <NavItem icon={Settings} label="Settings" />
        </nav>

        {/* Back to User Dashboard */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <Link to="/dashboard">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>User Dashboard</span>
            </button>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* ── Overview Stats ── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Platform Overview
              </h2>
              <span className="text-sm text-gray-500">
                Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Users" 
                value={totalUsers} 
                icon={Users} 
                color="primary"
                delay={0}
              />
              <StatCard 
                title="Total Reviews" 
                value={totalReviews} 
                icon={FileSearch} 
                color="blue"
                delay={1}
              />
              <StatCard 
                title="Repositories" 
                value={totalRepos} 
                icon={GitFork} 
                color="violet"
                delay={2}
              />
              <StatCard 
                title="Open Issues" 
                value={openIssues} 
                icon={AlertCircle} 
                color="amber"
                delay={3}
              />
            </div>
          </section>

          {/* ── Signups & Logins Row ── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={4}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Signups</h3>
                  <p className="text-xs text-gray-500">New user registrations</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Today" value={signupsToday} />
                <MiniStat label="Last 7 days" value={signups7d} />
                <MiniStat label="Last 30 days" value={signups30d} />
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={5}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Logins</h3>
                  <p className="text-xs text-gray-500">User login activity</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Today" value={loginsToday} />
                <MiniStat label="Last 7 days" value={logins7d} />
                <MiniStat label="Last 30 days" value={logins30d} />
              </div>
            </motion.div>
          </section>

          {/* ── Charts Row ── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Breakdown Donut */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={6}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Issue Breakdown</h3>
                  <p className="text-xs text-gray-500">Distribution by severity</p>
                </div>
                <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <DonutChart data={donutData} />
            </motion.div>

            {/* Reviews Trend Bar Chart */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={7}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Reviews — Last 7 Days</h3>
                  <p className="text-xs text-gray-500">Daily code review activity</p>
                </div>
                <div className="flex gap-1">
                  {["Daily", "Weekly", "Monthly"].map((period, idx) => (
                    <button
                      key={period}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        idx === 0 
                          ? "bg-primary text-white" 
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <BarChart data={reviewsByDay} height={180} />
            </motion.div>
          </section>

          {/* ── Issue Stats Row ── */}
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

          {/* ── Controls Row ── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance Mode */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={13}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isMaintenanceOn ? "bg-red-100 dark:bg-red-900/20" : "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    <Construction className={`h-5 w-5 ${isMaintenanceOn ? "text-red-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Maintenance Mode</h3>
                    <p className="text-xs text-gray-500">Block user access during maintenance</p>
                  </div>
                </div>
                <Button
                  variant={isMaintenanceOn ? "destructive" : "outline"}
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={handleToggleMaintenance}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isMaintenanceOn ? (
                    <PowerOff className="h-4 w-4" />
                  ) : (
                    <Power className="h-4 w-4" />
                  )}
                  {isMaintenanceOn ? "Turn OFF" : "Turn ON"}
                </Button>
              </div>
              
              <div className={`rounded-xl px-4 py-3 text-sm mb-4 ${
                isMaintenanceOn 
                  ? "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" 
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
              }`}>
                <span className="font-medium">Status:</span> {isMaintenanceOn ? "Active — Users cannot access" : "Inactive — Site operational"}
              </div>

              <div>
                <Label className="text-sm text-gray-600 dark:text-gray-400">Message</Label>
                <textarea
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={maintenanceMsg}
                  onChange={(e) => setMaintenanceMsg(e.target.value)}
                  placeholder="Message shown during maintenance..."
                />
              </div>
            </motion.div>

            {/* Notice Banner */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              custom={14}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isNoticeOn ? "bg-blue-100 dark:bg-blue-900/20" : "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    <Megaphone className={`h-5 w-5 ${isNoticeOn ? "text-blue-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notice Banner</h3>
                    <p className="text-xs text-gray-500">Display announcements to users</p>
                  </div>
                </div>
                <Button
                  variant={isNoticeOn ? "destructive" : "outline"}
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={handleToggleNotice}
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isNoticeOn ? (
                    <BellOff className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                  {isNoticeOn ? "Hide" : "Show"}
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Message</Label>
                  <Input
                    className="mt-2 rounded-xl"
                    value={noticeMsg}
                    onChange={(e) => setNoticeMsg(e.target.value)}
                    placeholder="Enter announcement message..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-gray-400">Type</Label>
                  <div className="flex gap-2 mt-2">
                    {(["info", "warning", "critical"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setNoticeType(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                          noticeType === t
                            ? t === "info"
                              ? "bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                              : t === "warning"
                              ? "bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300"
                              : "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleSaveNotice}
                  disabled={updateSettings.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </section>

          {/* ── Users & Activity Tables ── */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            {/* Tab Header */}
            <div className="flex items-center gap-1 p-4 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "users"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Users className="h-4 w-4" />
                All Users ({totalUsers})
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "activity"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Clock className="h-4 w-4" />
                Recent Activity
              </button>
            </div>

            {/* Users Table */}
            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Signed Up</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Sign In</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {u.email?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{u.email}</p>
                              <p className="text-xs text-gray-500">ID: {u.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                            {u.provider}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {u.lastSignIn ? formatDistanceToNow(new Date(u.lastSignIn), { addSuffix: true }) : "Never"}
                        </td>
                        <td className="px-6 py-4">
                          {u.emailConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                              <XCircle className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Activity Table */}
            {activeTab === "activity" && (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-gray-900">
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentActivity.map((a) => {
                      const eventStyles: Record<string, string> = {
                        signup: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                        login: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                        logout: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
                      };
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${eventStyles[a.event_type] || "bg-gray-100 text-gray-600"}`}>
                              {a.event_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {a.email || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">
                            {a.ip_address || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {recentActivity.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                          No activity logged yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
