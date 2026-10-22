import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useReviews, useRepositories } from "@/hooks/useReviews";
import { IssueDetailModal } from "@/components/IssueDetailModal";
import { Issue } from "@/data/mockData";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ExternalLink,
  ChevronRight,
  Filter,
  FileCode,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SupplyChain() {
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data: repositories = [] } = useRepositories();
  const { data: allIssues = [], isLoading } = useReviews(selectedRepo);

  // Filter for Supply Chain / Insecure Dependencies
  const supplyChainIssues = allIssues.filter(
    (i) =>
      i.category === "insecure_dependency" ||
      i.title.toLowerCase().includes("osv") ||
      i.title.toLowerCase().includes("dependency") ||
      i.title.toLowerCase().includes("cve")
  );

  const criticalCount = supplyChainIssues.filter((i) => i.severity === "critical").length;
  const highCount = supplyChainIssues.filter((i) => i.severity === "high").length;
  const mediumCount = supplyChainIssues.filter((i) => i.severity === "medium").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Supply Chain"
            subtitle="Software composition analysis (SCA) & open-source vulnerability intelligence"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base font-bold text-foreground">Sentinel Supply Chain</h1>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                        Available • Lockfile Transitive SCA
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Traverses direct and transitive dependency trees using Google OSV database batch intelligence.
                    </p>
                  </div>
                </div>

                {/* Repository Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">All Repositories ({repositories.length})</option>
                    {repositories.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Engine Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-500" />
                      package-lock.json Parser
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Supports lockfileVersion 1, 2, and 3. Resolves nested transitive dependencies.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-primary" />
                      OSV Batch Intelligence
                    </span>
                    <Badge variant="secondary" className="text-[10px]">Active</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Bulk queries <code className="text-[10px]">api.osv.dev/v1/querybatch</code> with in-memory caching.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      Multi-Ecosystem Roadmap
                    </span>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Planned</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Python (requirements.txt, poetry.lock) and Go (go.sum) scheduled for upcoming release.
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Critical CVEs</p>
                  <p className="text-xl font-bold text-red-500 mt-0.5">{criticalCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">High Severity Packages</p>
                  <p className="text-xl font-bold text-amber-500 mt-0.5">{highCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Medium Severity</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{mediumCount}</p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <PackageCheck className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Vulnerable Dependencies ({supplyChainIssues.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  OSV & GHSA Advisories
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Scanning software supply chain...</div>
              ) : supplyChainIssues.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">All Dependencies Secure</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    No vulnerable packages or known CVEs were found in the scanned package manifests and lockfiles.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {supplyChainIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              issue.severity === "critical"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : issue.severity === "high"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            }`}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate">{issue.title}</span>
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            {issue.fileName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="font-mono text-[10px] text-foreground/80">
                            {issue.suggestedFix || "Upgrade recommended"}
                          </span>
                          <span>•</span>
                          <span>Repo: {issue.repository}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Advisory
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </SidebarProvider>
  );
}
