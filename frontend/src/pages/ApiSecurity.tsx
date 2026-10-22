import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Network, AlertCircle, FileJson, Key, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ApiSecurity() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel API Security"
            subtitle="API specification auditing & endpoint security posture"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Sentinel API Security</h1>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[11px] font-semibold">
                      Planned • Roadmap Milestone
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automated analysis of OpenAPI 3.0 and Swagger definitions for broken object-level authorization (BOLA) and unauthenticated endpoints.
                  </p>
                </div>
              </div>

              {/* Honest Status Notice */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">
                    API Security Module in Specification Phase
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Static OpenAPI auditing will roll out in Phase 6. In accordance with platform standards, no mock endpoints or artificial API traffic results are displayed until dynamic testing and specification parsing are live.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture & Future Capabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <FileJson className="h-4 w-4 text-cyan-500" />
                  OpenAPI / Swagger Parsing
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Automatic discovery and static linting of <code className="text-[10px]">openapi.yaml</code> and <code className="text-[10px]">swagger.json</code> files committed to repository source trees.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Spec Parser Design</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <Key className="h-4 w-4 text-cyan-500" />
                  Authentication Inventory
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flagging API routes lacking security schemes (<code className="text-[10px]">bearerAuth</code>, <code className="text-[10px]">apiKey</code>) and identifying shadow or unauthenticated admin endpoints.
                </p>
                <div className="pt-2">
                  <Badge variant="secondary" className="text-[10px]">Policy Mapping</Badge>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <ShieldCheck className="h-4 w-4 text-cyan-500" />
                  Controlled Dynamic Verification
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Explicitly authorized staging environment testing with request limits, ensuring no unauthorized or destructive external requests are ever initiated.
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
