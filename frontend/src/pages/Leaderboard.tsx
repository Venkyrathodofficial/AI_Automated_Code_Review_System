import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard, LeaderboardEntry } from "@/lib/api";
import { Shield, Trophy, ArrowUpRight, Search, Sparkles, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "secure" | "improved">("all");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchLeaderboard();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = entries.filter((e) => {
    const matchesSearch = e.repository_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filter === "secure") {
      return e.security_score >= 90;
    }
    if (filter === "improved") {
      return e.most_improved;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/80 bg-slate-950/40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-50 to-slate-350 bg-clip-text text-transparent">
              SENTINEL <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Log In
              </Button>
            </Link>
            <Link to="/login?signup=true">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25">
                Join Sentinel
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 z-10">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full mb-4">
            <Trophy className="h-3.5 w-3.5" /> Community Rankings
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Security Leaderboard
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Celebrating the most secure repositories and active contributors. Sentinel rewards clean commits and vulnerability mitigation.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                filter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Projects
            </button>
            <button
              onClick={() => setFilter("secure")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                filter === "secure" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Most Secure (Grade A/A+)
            </button>
            <button
              onClick={() => setFilter("improved")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                filter === "improved" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Most Improved
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 w-full"
            />
          </div>
        </div>

        {/* Leaderboard Table Card */}
        <Card className="bg-slate-900/30 border-slate-800/80 overflow-hidden backdrop-blur-md shadow-2xl rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Repository</th>
                  <th className="py-4 px-6 text-center w-24">Grade</th>
                  <th className="py-4 px-6 text-center w-28">Security Score</th>
                  <th className="py-4 px-6 text-center hidden md:table-cell">Issues</th>
                  <th className="py-4 px-6 text-right hidden sm:table-cell">Last Scan</th>
                  <th className="py-4 px-6 text-right w-36">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-500">
                      <Sparkles className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading leaderboard rankings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-500">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-slate-500" />
                      No repositories found matching search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, index) => {
                    const isTop3 = entry.rank <= 3;
                    const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

                    let gradeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                    if (entry.security_grade.startsWith("B") || entry.security_grade.startsWith("C")) {
                      gradeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    } else if (entry.security_grade.startsWith("D")) {
                      gradeColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    }

                    return (
                      <motion.tr
                        key={entry.repository_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                        className="hover:bg-slate-800/20 transition-all group"
                      >
                        {/* Rank */}
                        <td className="py-4 px-6 text-center font-bold">
                          {isTop3 ? (
                            <span className="text-xl">{rankEmoji}</span>
                          ) : (
                            <span className="text-slate-500 font-mono">{entry.rank}</span>
                          )}
                        </td>

                        {/* Repository Name */}
                        <td className="py-4 px-6 font-semibold">
                          <div className="flex flex-col">
                            <span className="text-slate-200 group-hover:text-indigo-400 transition-colors">
                              {entry.repository_name}
                            </span>
                            <span className="text-xs text-slate-500 font-normal">
                              by @{entry.owner}
                            </span>
                          </div>
                        </td>

                        {/* Grade Badge */}
                        <td className="py-4 px-6 text-center">
                          <Badge className={`font-extrabold px-3 py-0.5 rounded-full border ${gradeColor}`}>
                            {entry.security_grade}
                          </Badge>
                        </td>

                        {/* Security Score Gauge */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-12 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full ${
                                  entry.security_score >= 90
                                    ? "bg-emerald-500"
                                    : entry.security_score >= 70
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{ width: `${entry.security_score}%` }}
                              />
                            </div>
                            <span className="font-semibold font-mono text-slate-250">
                              {entry.security_score}%
                            </span>
                          </div>
                        </td>

                        {/* Issues breakdown */}
                        <td className="py-4 px-6 text-center hidden md:table-cell">
                          <div className="flex justify-center gap-1.5 text-xs font-mono">
                            {entry.critical_issues > 0 && (
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/15">
                                {entry.critical_issues} Crit
                              </span>
                            )}
                            {entry.high_issues > 0 && (
                              <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/15">
                                {entry.high_issues} High
                              </span>
                            )}
                            {entry.critical_issues === 0 && entry.high_issues === 0 && (
                              <span className="text-emerald-400 font-sans text-xs">
                                Clean Core
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Last scan */}
                        <td className="py-4 px-6 text-right text-slate-400 text-xs hidden sm:table-cell font-mono">
                          {new Date(entry.last_scan_date).toLocaleDateString()}
                        </td>

                        {/* Improvement */}
                        <td className="py-4 px-6 text-right font-medium">
                          {entry.most_improved ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <ArrowUpRight className="h-3 w-3" />+{entry.score_improvement}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-900 bg-slate-950/60 text-center text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} CodeAurora Sentinel AI. All rights reserved.
      </footer>
    </div>
  );
}
