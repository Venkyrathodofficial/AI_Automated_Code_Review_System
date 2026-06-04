import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { 
  User, 
  Bell, 
  Shield, 
  GitFork, 
  Mail, 
  Key, 
  Globe, 
  Smartphone, 
  Loader2, 
  Check, 
  Activity, 
  Zap, 
  Clock, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { sendDetailedReportEmail } from "@/lib/api";
import { format } from "date-fns";

const SettingsPage = () => {
  const { user } = useAuth();
  const [githubConnected, setGithubConnected] = useState(false);
  const [checkingGithub, setCheckingGithub] = useState(true);
  const [subData, setSubData] = useState<{
    plan_tier: string;
    monthly_scans_used: number;
    monthly_scans_limit: number;
    current_period_end: string | null;
    status: string;
  } | null>(null);
  const [promoStatus, setPromoStatus] = useState<{ code: string; plan_granted: string; expires_at: string | null } | null>(null);

  // Check if user is connected to GitHub
  useEffect(() => {
    const checkGithub = async () => {
      setCheckingGithub(true);
      if (!user) {
        setGithubConnected(false);
        setCheckingGithub(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('github_token')
        .eq('id', user.id)
        .single();
      setGithubConnected(!!(data && data.github_token));
      setCheckingGithub(false);
    };
    checkGithub();
  }, [user]);

  // Fetch subscription and promo status
  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const [subRes, promoRes] = await Promise.all([
          fetch("/api/v1/billing/status", { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch("/api/v1/promo/status", { headers: { Authorization: `Bearer ${session.access_token}` } }),
        ]);
        if (subRes.ok) setSubData(await subRes.json());
        if (promoRes.ok) {
          const p = await promoRes.json();
          if (p.hasRedeemed && p.redemption) setPromoStatus(p.redemption);
        }
      } catch {}
    };
    fetchUsage();
  }, [user]);

  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [autoReview, setAutoReview] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Profile form state
  const meta = user?.user_metadata || {};
  const [firstName, setFirstName] = useState(meta.first_name || meta.full_name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(meta.last_name || meta.full_name?.split(" ").slice(1).join(" ") || "");
  const [organization, setOrganization] = useState(meta.organization || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Re-seed when user changes
  useEffect(() => {
    const m = user?.user_metadata || {};
    setFirstName(m.first_name || m.full_name?.split(" ")[0] || "");
    setLastName(m.last_name || m.full_name?.split(" ").slice(1).join(" ") || "");
    setOrganization(m.organization || "");
  }, [user]);

  const initials =
    (firstName?.[0] || "").toUpperCase() + (lastName?.[0] || user?.email?.[0] || "").toUpperCase() || "U";

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        organization,
      },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSendDetailedReport = async () => {
    setSendingReport(true);
    setReportError(null);
    setReportMessage(null);
    try {
      const result = await sendDetailedReportEmail({ includeResolved: true });
      setReportMessage(result.message);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Failed to send report");
    } finally {
      setSendingReport(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Settings" subtitle="Manage your account, billing, and team parameters" />
          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
            
            <Tabs defaultValue="profile" className="w-full max-w-5xl">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
                
                {/* ── Left Navigation Sidebar (Vercel/Linear style) ── */}
                <TabsList className="flex flex-row lg:flex-col bg-transparent border-0 h-auto p-0 mb-4 lg:mb-0 w-full lg:w-56 overflow-x-auto lg:overflow-visible justify-start gap-1 shrink-0 border-b lg:border-b-0 border-border pb-3 lg:pb-0">
                  <TabsTrigger 
                    value="profile" 
                    className="justify-start px-3 py-2.5 h-10 text-xs font-semibold rounded-xl w-auto lg:w-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted/40 transition-all gap-2"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span>Profile Info</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="usage" 
                    className="justify-start px-3 py-2.5 h-10 text-xs font-semibold rounded-xl w-auto lg:w-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted/40 transition-all gap-2"
                  >
                    <Activity className="h-4 w-4 shrink-0" />
                    <span>Subscription & Quotas</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="notifications" 
                    className="justify-start px-3 py-2.5 h-10 text-xs font-semibold rounded-xl w-auto lg:w-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted/40 transition-all gap-2"
                  >
                    <Bell className="h-4 w-4 shrink-0" />
                    <span>Alert Settings</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="integrations" 
                    className="justify-start px-3 py-2.5 h-10 text-xs font-semibold rounded-xl w-auto lg:w-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted/40 transition-all gap-2"
                  >
                    <GitFork className="h-4 w-4 shrink-0" />
                    <span>Integrations</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="security" 
                    className="justify-start px-3 py-2.5 h-10 text-xs font-semibold rounded-xl w-auto lg:w-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 hover:bg-muted/40 transition-all gap-2"
                  >
                    <Shield className="h-4 w-4 shrink-0" />
                    <span>Access & Security</span>
                  </TabsTrigger>
                </TabsList>

                {/* ── Right Content Panel ── */}
                <div className="flex-1 w-full min-w-0">

                  {/* 1. PROFILE TAB */}
                  <TabsContent value="profile" className="mt-0 outline-none space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-primary/40 via-primary to-violet-500/40" />
                        
                        <h3 className="text-sm font-bold text-card-foreground mb-6">Personal Profile</h3>
                        
                        <div className="flex items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-border/60">
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/10 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-lg sm:text-2xl font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-base font-bold text-card-foreground truncate">{firstName} {lastName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary/80 text-muted-foreground mt-2 uppercase border border-border/40">
                              {subData?.plan_tier || "Free"} Member
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-1.5">
                            <Label htmlFor="firstName" className="text-xs font-semibold text-muted-foreground">First Name</Label>
                            <Input 
                              id="firstName"
                              value={firstName} 
                              onChange={(e) => setFirstName(e.target.value)} 
                              className="h-10 text-sm rounded-xl border-border/80 focus-visible:ring-primary/20" 
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label htmlFor="lastName" className="text-xs font-semibold text-muted-foreground">Last Name</Label>
                            <Input 
                              id="lastName"
                              value={lastName} 
                              onChange={(e) => setLastName(e.target.value)} 
                              className="h-10 text-sm rounded-xl border-border/80 focus-visible:ring-primary/20" 
                            />
                          </div>
                          
                          <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
                            <div className="relative">
                              <Input 
                                value={user?.email || ""} 
                                readOnly 
                                className="h-10 text-sm bg-secondary/35 text-muted-foreground border-border/50 rounded-xl pr-10" 
                              />
                              <div className="absolute inset-y-0 right-3 flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <Label htmlFor="orgName" className="text-xs font-semibold text-muted-foreground">Organization / Workspace Name</Label>
                            <div className="relative">
                              <Input 
                                id="orgName"
                                value={organization} 
                                onChange={(e) => setOrganization(e.target.value)} 
                                className="h-10 text-sm rounded-xl pl-9 border-border/80 focus-visible:ring-primary/20" 
                                placeholder="Your startup or company name"
                              />
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-5 border-t border-border/60 flex justify-end">
                          <Button 
                            className="text-xs h-9 rounded-xl px-5 gap-2 font-semibold shadow-sm shadow-primary/10" 
                            onClick={handleSave} 
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : saved ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : null}
                            {saved ? "Saved Details" : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* 2. USAGE TAB */}
                  <TabsContent value="usage" className="mt-0 outline-none space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      
                      {/* Subscription Overview Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-card-foreground">Plan Quotas & Quota Metrics</h3>
                            <p className="text-xs text-muted-foreground">Monitor your real-time scan consumption limits.</p>
                          </div>
                          {subData && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                              subData.plan_tier === "admin" ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" :
                              (subData.plan_tier === "beta" || subData.plan_tier === "basic") ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                              "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                              {subData.plan_tier === "free" ? "Free Tier" : subData.plan_tier === "beta" || subData.plan_tier === "basic" ? "Pro Beta" : subData.plan_tier}
                            </span>
                          )}
                        </div>

                        {subData ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl border border-border bg-secondary/15">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Monthly Scans</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-xl font-bold font-mono">{subData.monthly_scans_used}</span>
                                  <span className="text-xs text-muted-foreground font-mono">/ {subData.monthly_scans_limit === 999999 ? "∞" : subData.monthly_scans_limit}</span>
                                </div>
                              </div>
                              <div className="p-4 rounded-xl border border-border bg-secondary/15">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Billing Status</span>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 capitalize mt-1.5 flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  Active ({subData.status || "—"})
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-muted-foreground">Usage Progress</span>
                                <span className="text-card-foreground font-mono">
                                  {Math.round((subData.monthly_scans_used / subData.monthly_scans_limit) * 100 || 0)}%
                                </span>
                              </div>
                              <Progress
                                value={Math.min(100, (subData.monthly_scans_used / subData.monthly_scans_limit) * 100)}
                                className="h-2 rounded-full"
                              />
                            </div>
                            
                            {subData.current_period_end && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-4 mt-1">
                                <Clock className="h-4 w-4" />
                                <span>Subscription renewal date:</span>
                                <span className="font-semibold text-card-foreground">{new Date(subData.current_period_end).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Loading usage logs...</span>
                          </div>
                        )}
                      </div>

                      {/* Promo Code Status Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-card-foreground">Access Codes & Promotions</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Activate startup promotion coupon codes.</p>
                          </div>
                        </div>

                        {promoStatus ? (
                          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                            <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Active Promotion: <code className="px-1.5 py-0.5 rounded bg-emerald-500/10 font-mono text-[11px]">{promoStatus.code}</code>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Granted Plan: <span className="font-semibold text-card-foreground capitalize">{promoStatus.plan_granted}</span>
                                {promoStatus.expires_at ? ` · Expires: ${new Date(promoStatus.expires_at).toLocaleDateString()}` : " · Lifetime Active"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border p-5 flex flex-col items-center justify-center text-center">
                            <Zap className="h-6 w-6 text-muted-foreground mb-2" />
                            <p className="text-xs font-bold text-card-foreground">No Active Promo Codes</p>
                            <p className="text-[11px] text-muted-foreground max-w-sm mt-0.5 mb-4">Are you a hackathon participant or early tester? Redeem an invite code to unlock unlimited scans.</p>
                            <a href="/billing">
                              <Button size="sm" className="h-8 text-xs rounded-lg gap-1">
                                <span>Redeem Promo Code</span>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* 3. ALERTS / NOTIFICATIONS TAB */}
                  <TabsContent value="notifications" className="mt-0 outline-none space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-card-foreground mb-1">Notification Preferences</h3>
                        <p className="text-xs text-muted-foreground mb-6">Configure how Sentinel alerts your dev team.</p>
                        
                        <div className="divide-y divide-border/60">
                          {/* Item 1 */}
                          <div className="flex items-center justify-between py-4 gap-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Mail className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-card-foreground">Email Security Summaries</p>
                                <p className="text-[11px] text-muted-foreground">Receive detailed PDF and email alerts for every commit scan result.</p>
                              </div>
                            </div>
                            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                          </div>

                          {/* Item 2 */}
                          <div className="flex items-center justify-between py-4 gap-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                <Smartphone className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-card-foreground">Slack Integration Alerts</p>
                                <p className="text-[11px] text-muted-foreground">Post scan reports directly into your developers' Slack channels.</p>
                              </div>
                            </div>
                            <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
                          </div>

                          {/* Item 3 */}
                          <div className="flex items-center justify-between py-4 gap-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                                <Bell className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-card-foreground">Critical Vulnerabilities Only</p>
                                <p className="text-[11px] text-muted-foreground">Mute low-severity warnings. Only send alerts for Critical or High items.</p>
                              </div>
                            </div>
                            <Switch checked={criticalOnly} onCheckedChange={setCriticalOnly} />
                          </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Interactive PDF report trigger */}
                        <div className="rounded-xl border border-border bg-secondary/15 p-4 space-y-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-card-foreground flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              Trigger Manual PDF Security Report
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Compile all security issues, code suggestions, and repository health metrics into a single detailed PDF and email it immediately.
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <Button
                              size="sm"
                              className="h-9 text-xs rounded-xl shadow-sm"
                              onClick={handleSendDetailedReport}
                              disabled={sendingReport}
                            >
                              {sendingReport ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Generating Report...
                                </>
                              ) : (
                                "Generate & Email PDF Report"
                              )}
                            </Button>
                            {reportMessage && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" /> {reportMessage}
                              </p>
                            )}
                            {reportError && (
                              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> {reportError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* 4. INTEGRATIONS TAB */}
                  <TabsContent value="integrations" className="mt-0 outline-none space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      
                      {/* GitHub Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/10 hover:shadow-md transition-all relative overflow-hidden group">
                        {githubConnected && (
                          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                        )}
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                            <GitFork className="h-5.5 w-5.5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-card-foreground">GitHub Cloud connection</p>
                              {githubConnected && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Authorize Sentinel to scan repository commits and pull requests.</p>
                          </div>
                        </div>
                        
                        <Button
                          variant={githubConnected ? "outline" : "default"}
                          size="sm"
                          className={`text-xs h-9 w-full sm:w-auto rounded-xl shrink-0 ${
                            githubConnected ? "border-emerald-250 text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 dark:border-emerald-800 dark:text-emerald-400" : ""
                          }`}
                          disabled={checkingGithub}
                          onClick={async () => {
                            if (!githubConnected && user) {
                              const session = await supabase.auth.getSession();
                              const sb_token = session.data.session?.access_token;
                              if (sb_token) {
                                const apiBase = import.meta.env.VITE_API_URL || "/api";
                                const absoluteBase = apiBase.startsWith("http") ? apiBase : `${window.location.origin}${apiBase}`;
                                window.location.href = `${absoluteBase}/auth/github?sb_token=${sb_token}`;
                              } else {
                                alert("Session expired. Please log in again.");
                              }
                            }
                          }}
                        >
                          {checkingGithub ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : githubConnected ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1 text-emerald-550" />
                              Connected Account
                            </>
                          ) : "Connect GitHub"}
                        </Button>
                      </div>

                      {/* GitLab Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-60 hover:opacity-75 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shrink-0">
                            <Globe className="h-5.5 w-5.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-card-foreground flex items-center gap-2">
                              GitLab Enterprise
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground tracking-wider uppercase border border-border">Soon</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Integrate self-hosted or GitLab Cloud repositories.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-9 w-full sm:w-auto rounded-xl shrink-0" disabled>
                          Connect GitLab
                        </Button>
                      </div>

                      {/* Slack Card */}
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-60 hover:opacity-75 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shrink-0">
                            <Smartphone className="h-5.5 w-5.5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-card-foreground flex items-center gap-2">
                              Slack Workspace Alert Bot
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground tracking-wider uppercase border border-border">Soon</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Hook automated notifications to Slack channels.</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-9 w-full sm:w-auto rounded-xl shrink-0" disabled>
                          Connect Slack
                        </Button>
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* 5. ACCESS & SECURITY TAB */}
                  <TabsContent value="security" className="mt-0 outline-none space-y-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      
                      {/* Access token card */}
                      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-card-foreground">Review Automation Settings</h3>
                          <p className="text-xs text-muted-foreground">Configure global repository scanning triggers.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-border bg-secondary/15">
                            <div className="flex items-start gap-3">
                              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-card-foreground">Auto-Review on Push</p>
                                <p className="text-[11px] text-muted-foreground">Run a security review automatically on every commit received via webhooks.</p>
                              </div>
                            </div>
                            <Switch checked={autoReview} onCheckedChange={setAutoReview} />
                          </div>

                          <Separator className="my-2" />

                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">API Token (Web CLI Access)</Label>
                            <p className="text-[11px] text-muted-foreground">Use this token to authenticate CLI scans or fetch results programmatically.</p>
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                              <Input 
                                value="sk_sentinel_••••••••••••••••••••" 
                                readOnly 
                                className="h-10 text-sm font-mono rounded-xl bg-secondary/35 text-muted-foreground border-border/60" 
                              />
                              <Button variant="outline" size="sm" className="h-10 text-xs shrink-0 w-full sm:w-auto rounded-xl gap-1.5 font-semibold">
                                <Key className="h-4 w-4" />
                                Regenerate Key
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Danger zone */}
                      <div className="rounded-2xl border-2 border-destructive/25 bg-card p-5 sm:p-6 shadow-sm space-y-4">
                        <div className="flex items-start gap-3">
                          <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions on your workspace account.</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Deleting your account deletes all scan logs, historical scores, connected GitHub webhooks, and billing profiles permanently. This action cannot be undone.
                        </p>
                        <div className="pt-2">
                          <Button variant="destructive" size="sm" className="text-xs h-9 rounded-xl font-semibold px-4">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                </div>
              </div>
            </Tabs>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SettingsPage;
