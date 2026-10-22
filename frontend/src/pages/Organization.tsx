import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/useAuth";
import { useRepositories } from "@/hooks/useReviews";
import {
  Building2,
  Users,
  Shield,
  FolderKanban,
  CreditCard,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Organization() {
  const { user } = useAuth();
  const { data: repositories = [] } = useRepositories();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Organization"
            subtitle="Team workspace management, repository isolation & member roles"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Organization & Workspaces</h1>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] font-semibold">
                      Partial Coverage • Workspace Isolation Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tenant isolation guarantees repository scans and reports remain private to your organization account.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Workspace Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground">Account Owner</span>
                <p className="text-sm font-bold text-foreground truncate">{user?.email || "developer"}</p>
                <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Authenticated Session Active
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground">Active Repositories</span>
                <p className="text-2xl font-bold text-primary">{repositories.length}</p>
                <p className="text-xs text-muted-foreground">Isolated under private account UUID</p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground">Agency Workspaces</span>
                <p className="text-sm font-bold text-foreground">Multi-Client Folders</p>
                <div className="pt-2">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Roadmap Milestone
                  </Badge>
                </div>
              </div>
            </div>

            {/* Agency Client Folders Roadmap Notice */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">Agency Client Workspace Isolation Roadmap</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Designed specifically for Indian software agencies managing multiple client codebases simultaneously. Upcoming features will include:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Grouping repositories into distinct client workspaces (e.g., Client A: Fintech, Client B: Healthcare).</li>
                <li>Client-specific white-label PDF security sign-off certificates.</li>
                <li>Granular role-based access control (RBAC) per client engagement.</li>
              </ul>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
