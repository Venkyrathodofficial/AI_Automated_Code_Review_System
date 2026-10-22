import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Box, Clock, Layers, ShieldCheck, Terminal, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ContainerSecurity() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Container"
            subtitle="Container image vulnerability scanning & Dockerfile security posture"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Sentinel Container</h1>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[11px] font-semibold">
                      Planned • Roadmap Milestone
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Static analysis for Dockerfiles and operating-system package vulnerability tracking for container images.
                  </p>
                </div>
              </div>

              {/* Honest Status Notice */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    Engine Under Active Development
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Container scanning is scheduled for an upcoming implementation milestone. To maintain complete data integrity, Sentinel does not generate simulated vulnerability numbers or placeholder scan reports until the container scanning engine is deployed and validated.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture & Future Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Terminal className="h-4 w-4 text-cyan-500" />
                  Dockerfile Misconfiguration Linting
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Static checks detecting non-root user execution (<code className="text-[10px]">USER</code> directive), unpinned base images, sensitive environment variables, and dangerous root capabilities.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">In Design</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Layers className="h-4 w-4 text-cyan-500" />
                  OS Package Vulnerabilities
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scanning underlying OS packages (Alpine, Debian, Ubuntu, RedHat) for CVEs using Trivy OSS vulnerability database integration.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Engine Evaluation</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <ShieldCheck className="h-4 w-4 text-cyan-500" />
                  CI/CD Container Gate
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automated pull request checks blocking container builds that introduce critical severity OS vulnerabilities into production deployment branches.
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
