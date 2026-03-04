import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  GitFork,
  FileSearch,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  Settings,
  Bell,
  BellOff,
  Power,
  PowerOff,
  Loader2,
  UserPlus,
  LogIn,
  Calendar,
  Clock,
  ChevronDown,
  Mail,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Megaphone,
  Construction,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAdminDashboard, useUpdateAdminSettings } from "@/hooks/useAdmin";
import { formatDistanceToNow } from "date-fns";

/* ── tiny helpers ── */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  delay = 0,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={delay}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-card-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */

const AdminDashboard = () => {
  const { data, isLoading, error } = useAdminDashboard();
  const updateSettings = useUpdateAdminSettings();

  /* local form state for settings */
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");
  const [noticeType, setNoticeType] = useState<"info" | "warning" | "critical">("info");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Sync settings to local state once loaded
  if (data?.settings && !settingsLoaded) {
    setMaintenanceMsg(data.settings.maintenance_message || "");
    setNoticeMsg(data.settings.notice_message || "");
    setNoticeType((data.settings.notice_type as "info" | "warning" | "critical") || "info");
    setSettingsLoaded(true);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-2">You do not have admin privileges.</p>
          <Link to="/dashboard">
            <Button variant="outline" className="mt-4 rounded-xl gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
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

  const handleSaveMaintenanceMsg = () => {
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

  const noticeColors = {
    info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
    critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight">Admin Panel</h1>
              <p className="text-[10px] text-muted-foreground">Master Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" /> User Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ── Overview Stats ── */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Platform Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total Users" value={totalUsers} icon={Users} color="bg-primary/10 text-primary" delay={0} />
            <StatCard title="Total Reviews" value={totalReviews} icon={FileSearch} color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" delay={1} />
            <StatCard title="Repositories" value={totalRepos} icon={GitFork} color="bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400" delay={2} />
            <StatCard title="Critical" value={criticalIssues} icon={AlertTriangle} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" delay={3} />
            <StatCard title="Open Issues" value={openIssues} icon={AlertCircle} color="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" delay={4} />
            <StatCard title="Resolved" value={resolvedIssues} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" delay={5} />
          </div>
        </section>

        {/* ── Signups & Logins ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={6}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-card-foreground">Signups</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{signupsToday}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Today</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{signups7d}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Last 7 days</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{signups30d}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={7}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
                <LogIn className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-card-foreground">Logins</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{loginsToday}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Today</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{logins7d}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Last 7 days</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-card-foreground">{logins30d}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Review severity breakdown ── */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" /> Issue Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard title="Critical" value={criticalIssues} icon={AlertTriangle} color="bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" />
            <StatCard title="Medium" value={mediumIssues} icon={AlertCircle} color="bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" />
            <StatCard title="Low" value={lowIssues} icon={Info} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />
            <StatCard title="Open" value={openIssues} icon={AlertCircle} color="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" />
            <StatCard title="Resolved" value={resolvedIssues} icon={CheckCircle2} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" />
          </div>
        </section>

        {/* ── Reviews last 7 days chart (simple bar) ── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={8}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Reviews — Last 7 Days
          </h3>
          <div className="flex items-end gap-3 h-40">
            {reviewsByDay.map((day) => {
              const max = Math.max(...reviewsByDay.map((d) => d.count), 1);
              const pct = (day.count / max) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-card-foreground">{day.count}</span>
                  <div className="w-full rounded-t-lg bg-primary/20 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-primary transition-all"
                      style={{ height: "100%" }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ── Maintenance Mode & Notice Controls ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maintenance Mode */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={9}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/20">
                  <Construction className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Maintenance Mode</h3>
                  <p className="text-[10px] text-muted-foreground">Block user access when enabled</p>
                </div>
              </div>
              <Button
                variant={isMaintenanceOn ? "destructive" : "outline"}
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={handleToggleMaintenance}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isMaintenanceOn ? (
                  <PowerOff className="h-3.5 w-3.5" />
                ) : (
                  <Power className="h-3.5 w-3.5" />
                )}
                {isMaintenanceOn ? "Turn OFF" : "Turn ON"}
              </Button>
            </div>

            <div className={`rounded-xl border px-3 py-2 text-xs mb-3 ${isMaintenanceOn ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
              Status: <span className="font-bold">{isMaintenanceOn ? "ACTIVE — Users cannot access features" : "OFF — Site is operational"}</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Maintenance Message</Label>
              <textarea
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                value={maintenanceMsg}
                onChange={(e) => setMaintenanceMsg(e.target.value)}
                placeholder="Enter message shown to users during maintenance..."
              />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={handleSaveMaintenanceMsg}
                disabled={updateSettings.isPending}
              >
                Save Message
              </Button>
            </div>
          </motion.div>

          {/* Notice/Announcement */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={10}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-card-foreground">Notice Banner</h3>
                  <p className="text-[10px] text-muted-foreground">Show announcements to all users</p>
                </div>
              </div>
              <Button
                variant={isNoticeOn ? "destructive" : "outline"}
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={handleToggleNotice}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isNoticeOn ? (
                  <BellOff className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {isNoticeOn ? "Hide Notice" : "Show Notice"}
              </Button>
            </div>

            {isNoticeOn && noticeMsg && (
              <div className={`rounded-xl border px-3 py-2 text-xs mb-3 ${noticeColors[noticeType]}`}>
                Preview: {noticeMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Notice Message</Label>
                <Input
                  className="mt-1 rounded-xl text-sm"
                  value={noticeMsg}
                  onChange={(e) => setNoticeMsg(e.target.value)}
                  placeholder="e.g. Scheduled downtime on Saturday 2AM UTC"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="flex gap-2 mt-1">
                  {(["info", "warning", "critical"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNoticeType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        noticeType === t
                          ? t === "info"
                            ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                            : t === "warning"
                            ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300"
                            : "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
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
                className="rounded-xl text-xs"
                onClick={handleSaveNotice}
                disabled={updateSettings.isPending}
              >
                Save Notice
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ── All Users Table ── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={11}
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground">All Users ({totalUsers})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Provider</th>
                  <th className="text-left px-5 py-3 font-medium">Signed Up</th>
                  <th className="text-left px-5 py-3 font-medium">Last Sign In</th>
                  <th className="text-left px-5 py-3 font-medium">Confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-card-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{u.email}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{u.provider}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {u.lastSignIn ? formatDistanceToNow(new Date(u.lastSignIn), { addSuffix: true }) : "Never"}
                    </td>
                    <td className="px-5 py-3">
                      {u.emailConfirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── Recent Activity Log ── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={12}
          className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-card-foreground">Recent Activity</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="bg-muted/40 text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">Event</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">IP</th>
                  <th className="text-left px-5 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.map((a) => {
                  const eventColors: Record<string, string> = {
                    signup: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
                    login: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                    logout: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400",
                  };
                  return (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${eventColors[a.event_type] || "bg-muted text-muted-foreground"}`}>
                          {a.event_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground truncate max-w-[180px]">{a.email || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono">{a.ip_address || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      No activity logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default AdminDashboard;
