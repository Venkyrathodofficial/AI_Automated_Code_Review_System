import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicReport, ReviewRow, ScanHistory } from "@/lib/api";
import { Shield, Download, ExternalLink, Calendar, GitCommit, FileCode, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function ReportShare() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanHistory | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ReviewRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadReport() {
      if (!scanId) return;
      try {
        const data = await fetchPublicReport(scanId);
        setScan(data.scan);
        
        // Filter out structural clean rows if present
        const filteredReviews = (data.reviews || []).filter(
          (r) =>
            !r.issue_title.toLowerCase().includes("no issues found") &&
            !r.issue_title.toLowerCase().includes("clean commit") &&
            !r.issue_title.toLowerCase().includes("scan complete")
        );
        setReviews(filteredReviews);
        if (filteredReviews.length > 0) {
          setSelectedIssue(filteredReviews[0]);
        }
      } catch (err) {
        console.error("Failed to load public report:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [scanId]);

  const handleDownloadPdf = () => {
    if (!scanId) return;
    const base = import.meta.env.VITE_API_URL || "/api/v1";
    window.open(`${base}/reports/pdf?scanId=${scanId}`, "_blank");
    toast({
      title: "Generating PDF Report",
      description: "Your download will start automatically in a new tab.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Public report link copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center font-sans">
        <Shield className="h-10 w-10 text-indigo-500 animate-pulse mb-4" />
        <p className="text-slate-400 text-sm">Decrypting Sentinel Security Audit...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center font-sans p-6">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Report Not Found</h2>
        <p className="text-slate-400 text-sm text-center max-w-md mb-6">
          The requested security report does not exist or may have been deleted by the owner.
        </p>
        <Link to="/">
          <Button className="bg-indigo-600 hover:bg-indigo-500">Go to Home</Button>
        </Link>
      </div>
    );
  }

  // Determine Grade Color
  let gradeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (scan.security_grade.startsWith("B") || scan.security_grade.startsWith("C")) {
    gradeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  } else if (scan.security_grade.startsWith("D")) {
    gradeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-900 bg-slate-950/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-50 to-slate-350 bg-clip-text text-transparent">
              SENTINEL <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </Link>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-800 text-slate-300 hover:text-white" onClick={handleCopyLink}>
              Share Link
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25" onClick={handleDownloadPdf}>
              <Download className="h-4 w-4 mr-2" /> PDF Report
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Summary Card & Scan Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Scorecard Card */}
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center py-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Security Grade</span>
              <div className="my-2">
                <span className={`inline-block font-extrabold text-5xl px-6 py-2 rounded-2xl border ${gradeColor}`}>
                  {scan.security_grade}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-3">
                Health Score: <span className="text-slate-200 font-bold font-mono">{scan.security_score}/100</span>
              </p>
            </div>

            <hr className="border-slate-800/50 my-6" />

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-center">
                <span className="text-2xl font-bold text-rose-500 font-mono">{scan.critical_issues || 0}</span>
                <span className="block text-[10px] text-slate-400 font-bold tracking-wide mt-1">CRITICAL</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-center">
                <span className="text-2xl font-bold text-orange-500 font-mono">{scan.high_issues || 0}</span>
                <span className="block text-[10px] text-slate-400 font-bold tracking-wide mt-1">HIGH</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-center">
                <span className="text-2xl font-bold text-amber-500 font-mono">{scan.medium_issues || 0}</span>
                <span className="block text-[10px] text-slate-400 font-bold tracking-wide mt-1">MEDIUM</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-center">
                <span className="text-2xl font-bold text-emerald-500 font-mono">{scan.low_issues || 0}</span>
                <span className="block text-[10px] text-slate-400 font-bold tracking-wide mt-1">LOW</span>
              </div>
            </div>
          </Card>

          {/* Repo Info Card */}
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scan Metadata</h3>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3 text-slate-350">
                <FileCode className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Repository</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[220px]">{scan.repository_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-350">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Scanned Date</span>
                  <span className="font-semibold text-slate-200">{new Date(scan.scan_date).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-350">
                <GitCommit className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Commit ID</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {scan.commit_id ? scan.commit_id.substring(0, 8) : "Manual Scan"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-350">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500">Files Analyzed</span>
                  <span className="font-semibold text-slate-200">{scan.files_scanned || 0} Files</span>
                </div>
              </div>
            </div>
          </Card>

          {/* SaaS CTA Banner */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 p-5 rounded-2xl border border-indigo-900/30 text-center relative overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <h4 className="font-bold text-sm text-indigo-300 mb-1.5">Scan Your Own Repositories</h4>
            <p className="text-xs text-slate-400 mb-4">
              Get premium grade scorecards, automated fixes, and Slack/email alerts in minutes.
            </p>
            <Link to="/login?signup=true">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">
                Get Started Free <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

        </div>

        {/* Right Side: Scan Issues list & Issue Details (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Vulnerabilities Found <Badge variant="secondary" className="bg-slate-800">{reviews.length}</Badge>
            </h2>
          </div>

          {reviews.length === 0 ? (
            <Card className="bg-slate-900/20 border-slate-800/80 p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
              <h3 className="font-bold text-slate-200">No issues found!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                This repository is fully clean. No security risks, API key leaks, or injection bugs detected.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Issues List Column (5 cols) */}
              <div className="md:col-span-5 space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {reviews.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  
                  let dotColor = "bg-emerald-500";
                  let borderHover = "hover:border-emerald-500/30";
                  const sev = String(issue.severity).toLowerCase();
                  if (sev === "critical") {
                    dotColor = "bg-rose-500";
                    borderHover = "hover:border-rose-500/30";
                  } else if (sev === "high") {
                    dotColor = "bg-orange-500";
                    borderHover = "hover:border-orange-500/30";
                  } else if (sev === "medium") {
                    dotColor = "bg-amber-500";
                    borderHover = "hover:border-amber-500/30";
                  }

                  return (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500/80 shadow-md shadow-indigo-600/5"
                          : "bg-slate-950/40 border-slate-850 " + borderHover
                      }`}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-200 truncate">{issue.issue_title}</h4>
                        <span className="text-[10px] text-slate-500 truncate block mt-0.5 font-mono">
                          {issue.file_name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Issue Details View Column (7 cols) */}
              <div className="md:col-span-7">
                <AnimatePresence mode="wait">
                  {selectedIssue && (
                    <motion.div
                      key={selectedIssue.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-slate-900/20 border-slate-800/80 backdrop-blur-md p-6 rounded-xl space-y-5">
                        
                        {/* Title, Severity & File */}
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-bold text-slate-100 text-sm leading-snug">
                              {selectedIssue.issue_title}
                            </h3>
                            <Badge className={`text-[10px] font-extrabold uppercase py-0.5 px-2.5 rounded-full shrink-0 ${
                              selectedIssue.severity?.toLowerCase() === "critical"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : selectedIssue.severity?.toLowerCase() === "high"
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : selectedIssue.severity?.toLowerCase() === "medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {selectedIssue.severity}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 font-mono mt-2 block break-all">
                            {selectedIssue.file_name} {selectedIssue.line_number && `: Line ${selectedIssue.line_number}`}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Vulnerability Impact</h4>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {selectedIssue.issue_description}
                          </p>
                        </div>

                        {/* Recommendation */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Suggested Remediation</h4>
                          <p className="text-slate-300 text-xs leading-relaxed">
                            {selectedIssue.suggestion}
                          </p>
                        </div>

                        {/* Code Comparison boxes */}
                        {(selectedIssue.secure_code) && (
                          <div className="space-y-4">
                            
                            {/* Vulnerable Code snippet */}
                            {selectedIssue.offending_line && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Vulnerable Code</span>
                                <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg font-mono text-[10px] text-rose-200 overflow-x-auto whitespace-pre">
                                  {selectedIssue.offending_line}
                                </div>
                              </div>
                            )}

                            {/* Secure code block */}
                            {selectedIssue.secure_code && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Secure Fix</span>
                                <div className="p-3 bg-emerald-950/10 border border-emerald-900/20 rounded-lg font-mono text-[10px] text-emerald-350 overflow-x-auto whitespace-pre">
                                  {selectedIssue.secure_code}
                                </div>
                              </div>
                            )}

                          </div>
                        )}

                        {/* Best Practices */}
                        {selectedIssue.best_practices && (
                          <div className="space-y-1.5 border-t border-slate-800/60 pt-4">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                              Remediation Best Practices
                            </h4>
                            <p className="text-slate-400 text-xs leading-relaxed">
                              {selectedIssue.best_practices}
                            </p>
                          </div>
                        )}

                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 bg-slate-950/60 text-center text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} CodeAurora Sentinel AI. All rights reserved.
      </footer>
    </div>
  );
}
