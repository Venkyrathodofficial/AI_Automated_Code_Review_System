import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Ban,
  FileCode2,
  Settings2,
  Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Policies() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Policies"
            subtitle="Automated security quality gates, risk thresholds & compliance policies"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Automation & Security Policies</h1>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] font-semibold">
                      Partial Coverage • Readiness Gates Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enforces pull request blocking gates and release criteria based on deterministic severity thresholds and readiness scores.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Policy Gates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    PASS Verdict Gate
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Repository health score <code className="text-[10px]">&gt;= 80/100</code> with 0 open critical findings. PR checks automatically pass.
                </p>
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  status: success (unblocks merge)
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    WARN Verdict Gate
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Medium-severity issues detected without critical vulnerabilities. PR receives warning advisory comments without hard merge block.
                </p>
                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  status: neutral / warning advisory
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <Ban className="h-4 w-4" />
                    BLOCK Verdict Gate
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Any confirmed critical finding (e.g. leaked secret, SQLi, or RCE). GitHub commit check is marked as failed, blocking protected branches.
                </p>
                <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[11px] text-red-600 dark:text-red-400 font-mono">
                  status: failure (blocks merge)
                </div>
              </div>
            </div>

            {/* Custom Policy Ruleset Roadmap */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Repository Policy File (.sentinel.yml)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Custom rule suppression and compliance baseline definition.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  In Progress
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-muted/40 font-mono text-xs text-foreground/90 overflow-x-auto space-y-1">
                <p className="text-muted-foreground"># .sentinel.yml (Sample Policy Definition)</p>
                <p><span className="text-primary">version:</span> "1.0"</p>
                <p><span className="text-primary">fail_on:</span></p>
                <p>  - severity: "critical"</p>
                <p>  - category: "api_key_exposure"</p>
                <p><span className="text-primary">ignore_rules:</span></p>
                <p>  - "INSECURE_CORS_ORIGIN"  <span className="text-muted-foreground"># Permitted on staging microservices</span></p>
                <p><span className="text-primary">compliance_targets:</span></p>
                <p>  - "DPDP_ACT_2023"</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
