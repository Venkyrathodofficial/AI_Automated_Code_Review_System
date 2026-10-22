import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/useAuth";
import {
  Puzzle,
  CheckCircle2,
  GitBranch,
  MessageSquare,
  Radio,
  ExternalLink,
  ShieldCheck,
  Copy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Integrations() {
  const { user } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || "https://ai-automated-code-review-system.onrender.com";
  const webhookUrl = `${apiBase}/webhook/github/${user?.id || ":userId"}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Integrations"
            subtitle="Developer platform connections, webhooks & automated notification channels"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Puzzle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Integrations & Webhooks</h1>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                      Available • GitHub Integration Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connect Sentinel to version control platforms and messaging channels for automated security alerts.
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GitHub */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-foreground" />
                    <span className="text-xs font-bold text-foreground">GitHub</span>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-[10px]">
                    Connected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Repository sync, pull request verification comments, and commit check-run gates.
                </p>
                <div className="p-2.5 rounded-xl bg-muted/40 font-mono text-[10px] break-all flex items-center justify-between gap-2">
                  <span className="truncate">{webhookUrl}</span>
                  <button onClick={handleCopyWebhook} className="shrink-0 p-1 hover:bg-muted rounded">
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Slack */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">Slack</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Planned
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time webhook notifications dispatched directly to team channels when critical vulnerabilities or secrets are detected.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-muted-foreground">Scheduled for Phase 3</span>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">WhatsApp Business</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Planned
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Urgent alerts for Indian engineering leads and founders on critical release-blocking security findings.
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-muted-foreground">Scheduled for Phase 3</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
