import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { useRepositories } from "@/hooks/useReviews";
import {
  FileBarChart2,
  Download,
  Share2,
  ShieldCheck,
  ExternalLink,
  Award,
  CheckCircle2,
  Copy,
  Code
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Reports() {
  const { data: repositories = [], isLoading } = useRepositories();
  const apiBase = import.meta.env.VITE_API_URL || "/api/v1";

  const handleDownloadPdf = (repoName: string) => {
    window.open(`${apiBase}/reports/pdf?repo=${encodeURIComponent(repoName)}`, "_blank");
    toast.success(`Generating PDF report for ${repoName}`);
  };

  const handleCopyBadge = (repoName: string) => {
    const [owner, repo] = repoName.split("/");
    const badgeUrl = `${apiBase}/repositories/badge/${owner}/${repo}`;
    const markdown = `[![Sentinel AI Security Status](${badgeUrl})](https://codeaurorasentinel.vercel.app/)`;
    navigator.clipboard.writeText(markdown);
    toast.success("Copied Markdown badge snippet to clipboard!");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav
            title="Sentinel Reports"
            subtitle="Executive audit reports, PDF exports, and repository security badges"
          />

          <main className="flex-1 overflow-auto p-4 sm:p-6 bg-background space-y-6">
            {/* Header Status & Engine Identity */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileBarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-foreground">Security Reports & Badges</h1>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                      Available • PDF Generation Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Export executive-ready PDF audit assessments and embed dynamic SVG security status badges in your READMEs.
                  </p>
                </div>
              </div>
            </div>

            {/* Repositories Report Export Cards */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Repository Security Reports ({repositories.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  PDFKit Engine & Cryptographic HMAC Verification
                </span>
              </div>

              {isLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">Loading reports...</div>
              ) : repositories.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Award className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">No Repositories Scanned</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Connect and scan a repository to generate security audit reports and badges.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {repositories.map((repo) => (
                    <div key={repo.name} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">{repo.name}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              (repo.security_grade || "A").startsWith("A")
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            Grade {repo.security_grade || "A"} ({repo.healthScore ?? 100}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>Issues: {repo.totalReviews} total</span>
                          <span>•</span>
                          <span>Files Audited: {repo.filesReviewed}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDownloadPdf(repo.name)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-primary" />
                          <span>Download PDF</span>
                        </button>

                        <button
                          onClick={() => handleCopyBadge(repo.name)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent text-foreground flex items-center gap-1.5 transition-colors"
                        >
                          <Code className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Copy SVG Badge</span>
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
    </SidebarProvider>
  );
}
