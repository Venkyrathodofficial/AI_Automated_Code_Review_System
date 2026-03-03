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
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Tabs defaultValue="profile" className="max-w-3xl">
              <TabsList className="bg-secondary h-9 p-1 mb-6">
                <TabsTrigger value="profile" className="text-xs h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Bell className="h-3.5 w-3.5 mr-1.5" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="integrations" className="text-xs h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <GitFork className="h-3.5 w-3.5 mr-1.5" />
                  Integrations
                </TabsTrigger>
                <TabsTrigger value="security" className="text-xs h-7 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-card-foreground mb-4">Personal Information</h3>
                    <div className="flex items-center gap-5 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{firstName} {lastName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">First Name</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5 h-9 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Name</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5 h-9 text-sm" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <Input value={user?.email || ""} readOnly className="mt-1.5 h-9 text-sm bg-secondary" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Organization</Label>
                        <Input value={organization} onChange={(e) => setOrganization(e.target.value)} className="mt-1.5 h-9 text-sm" />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button size="sm" className="text-xs h-8" onClick={handleSave} disabled={saving}>
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
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-card-foreground mb-1">Notification Preferences</h3>
                    <p className="text-xs text-muted-foreground mb-5">Choose how you want to be notified about issues.</p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-card-foreground">Email Notifications</p>
                            <p className="text-xs text-muted-foreground">Get notified via email for new issues</p>
                          </div>
                        </div>
                        <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-card-foreground">Slack Notifications</p>
                            <p className="text-xs text-muted-foreground">Send alerts to your Slack channel</p>
                          </div>
                        </div>
                        <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-card-foreground">Critical Only</p>
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
                    <div key={integration.name} className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <integration.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-card-foreground">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.desc}</p>
                        </div>
                      </div>
                      <Button
                        variant={integration.connected ? "outline" : "default"}
                        size="sm"
                        className="text-xs h-8"
                      >
                        {integration.connected ? "Connected" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-card-foreground mb-1">Review Settings</h3>
                    <p className="text-xs text-muted-foreground mb-5">Configure how code reviews are performed.</p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-card-foreground">Auto-Review on Push</p>
                            <p className="text-xs text-muted-foreground">Automatically analyze code on every commit</p>
                          </div>
                        </div>
                        <Switch checked={autoReview} onCheckedChange={setAutoReview} />
                      </div>
                      <Separator />
                      <div>
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <div className="flex gap-2 mt-1.5">
                          <Input value="sk-••••••••••••••••••••" readOnly className="h-9 text-sm font-mono" />
                          <Button variant="outline" size="sm" className="h-9 text-xs shrink-0">
                            <Key className="h-3.5 w-3.5 mr-1" />
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-destructive/30 bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-destructive mb-1">Danger Zone</h3>
                    <p className="text-xs text-muted-foreground mb-4">Irreversible actions for your account.</p>
                    <Button variant="destructive" size="sm" className="text-xs h-8">
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
