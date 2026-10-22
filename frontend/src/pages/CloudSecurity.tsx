import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Cloud, AlertCircle, FileCode, ShieldAlert, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CloudSecurity() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Cloud"
            subtitle="Infrastructure as Code (IaC) security & cloud posture validation"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Sentinel Cloud</h1>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[11px] font-semibold">
                      Planned • Roadmap Milestone
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shift-left cloud security scanning for Terraform configurations and Kubernetes manifests.
                  </p>
                </div>
              </div>

              {/* Honest Status Notice */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    IaC Scanning Module Scheduled for Phase 5
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Infrastructure-as-Code scanning will be enabled in an upcoming platform release. In accordance with Sentinel's strict data accuracy principles, this page does not present artificial scan counts or synthetic security postures.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture & Future Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <FileCode className="h-4 w-4 text-cyan-500" />
                  Terraform Static Audit
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scrutinizing <code className="text-[10px]">.tf</code> files for overly permissive security groups (<code className="text-[10px]">0.0.0.0/0</code> on SSH/RDP), unencrypted storage volumes, and public S3 buckets.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Architecture Design</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                  Kubernetes Manifest Hardening
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flagging privileged container execution, root host paths, missing network policies, and absent memory/CPU resource quotas.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Policy Mapping</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <ShieldAlert className="h-4 w-4 text-cyan-500" />
                  Cloud Misconfiguration Blocking
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enforcing security boundaries during PR checks so cloud infrastructure mistakes never reach production AWS, GCP, or Azure environments.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Planned Phase</Badge>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
