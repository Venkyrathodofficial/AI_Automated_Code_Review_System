import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { motion } from "framer-motion";
import { User, Bell, Shield, GitFork, Mail, Key, Globe, Smartphone, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const SettingsPage = () => {
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [autoReview, setAutoReview] = useState(true);

  // Profile form state — seeded from Supabase user
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Settings" subtitle="Manage your account and preferences" />
          <main className="flex-1 overflow-auto p-3 sm:p-6 bg-background">
            <Tabs defaultValue="profile" className="max-w-3xl">
              <TabsList className="bg-card border border-border h-10 p-1 mb-6 w-full overflow-x-auto flex justify-start sm:w-auto sm:inline-flex rounded-xl">
                <TabsTrigger value="profile" className="text-xs h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Profile</span>
                  <span className="sm:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Notifications</span>
                  <span className="sm:hidden">Notifs</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <GitFork className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Integrations</span>
                  <span className="sm:hidden">Integ</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs h-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  <span>Security</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-5">Personal Information</h3>
                    <div className="flex items-center gap-4 sm:gap-5 mb-6">
                      <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-card-foreground truncate">{firstName} {lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 h-10 text-sm rounded-xl" />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5 h-10 text-sm rounded-xl" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                        <Input value={user?.email || ""} readOnly className="mt-1.5 h-10 text-sm bg-secondary/50 rounded-xl" />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">Organization</Label>
                        <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-1.5 h-10 text-sm rounded-xl" />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button size="sm" className="text-xs h-9 rounded-xl px-5" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 mr-1.5" /> : null}
                        {saved ? "Saved!" : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-1">Notification Preferences</h3>
                    <p className="text-xs text-muted-foreground mb-5">Choose how you want to be notified about issues.</p>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Get notified via email for new issues</p>
                          </div>
                        </div>
                        <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                      </div>
                      <Separator className="mx-3" />
                      <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Smartphone className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Slack Notifications</p>
                            <p className="text-xs text-muted-foreground">Send alerts to your Slack channel</p>
                          </div>
                        </div>
                        <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
                      </div>
                      <Separator className="mx-3" />
                      <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/20">
                            <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Critical Only</p>
                            <p className="text-xs text-muted-foreground">Only notify for critical severity issues</p>
                          </div>
                        </div>
                        <Switch checked={criticalOnly} onCheckedChange={setCriticalOnly} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {[
                    { name: "GitHub", desc: "Automatically review commits and pull requests", icon: GitFork, connected: true },
                    { name: "GitLab", desc: "Connect your GitLab repositories", icon: Globe, connected: false },
                    { name: "Slack", desc: "Send notifications to Slack channels", icon: Smartphone, connected: false },
                  ].map((integration) => (
                    <div key={integration.name} className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                          <integration.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-card-foreground">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.desc}</p>
                        </div>
                      </div>
                        <Button
                          variant={integration.connected ? "outline" : "default"}
                          size="sm"
                          className={`text-xs h-9 w-full sm:w-auto rounded-xl ${integration.connected ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20" : ""}`}
                        >
                        {integration.connected ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Connected
                          </>
                        ) : "Connect"}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-card-foreground mb-1">Review Settings</h3>
                    <p className="text-xs text-muted-foreground mb-5">Configure how code reviews are performed.</p>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-primary/[0.03] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Auto-Review on Push</p>
                            <p className="text-xs text-muted-foreground">Automatically analyze code on every commit</p>
                          </div>
                        </div>
                        <Switch checked={autoReview} onCheckedChange={setAutoReview} />
                      </div>
                      <Separator className="mx-3" />
                      <div className="pt-3 px-3">
                        <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
                        <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                          <Input value="sk-••••••••••••••••••••" readOnly className="h-10 text-sm font-mono rounded-xl" />
                          <Button variant="outline" size="sm" className="h-10 text-xs shrink-0 w-full sm:w-auto rounded-xl">
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-destructive/20 bg-card p-5 sm:p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-destructive mb-1">Danger Zone</h3>
                    <p className="text-xs text-muted-foreground mb-4">Irreversible actions for your account.</p>
                    <Button variant="destructive" size="sm" className="text-xs h-9 rounded-xl">
                      Delete Account
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SettingsPage;
