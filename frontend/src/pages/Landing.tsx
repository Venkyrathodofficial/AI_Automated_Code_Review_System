import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  GitPullRequest,
  Bug,
  BarChart3,
  Zap,
  Lock,
  ArrowRight,
  Code2,
  CheckCircle2,
  Github,
  ChevronRight,
  Star,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Reusable tiny components                                          */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Bug,
    title: "AI‑Powered Bug Detection",
    description:
      "Automatically catch bugs, security vulnerabilities, and code smells before they reach production. Our AI analyzes every commit in real time.",
  },
  {
    icon: GitPullRequest,
    title: "Pull Request Reviews",
    description:
      "Get instant, context-aware feedback on every pull request. AI reviews code style, logic errors, and potential regressions automatically.",
  },
  {
    icon: BarChart3,
    title: "Risk Analytics Dashboard",
    description:
      "Visualize code health with severity charts, trend analysis, and per-repository risk scores — all in one beautiful dashboard.",
  },
  {
    icon: Zap,
    title: "Lightning-Fast Feedback",
    description:
      "Reviews complete in seconds, not hours. Developers get actionable suggestions inline so they can fix issues immediately.",
  },
  {
    icon: Lock,
    title: "Security-First Scanning",
    description:
      "Detect SQL injection, XSS, hard-coded secrets, and OWASP Top 10 vulnerabilities with every push.",
  },
  {
    icon: Code2,
    title: "Multi-Language Support",
    description:
      "Works with JavaScript, TypeScript, Python, Java, Go, Rust, and more. One tool for your entire polyglot codebase.",
  },
];

const steps = [
  {
    step: "01",
    title: "Connect Your Repository",
    description:
      "Link your GitHub repositories in one click. We integrate via GitHub App — no tokens to manage.",
  },
  {
    step: "02",
    title: "Push Code or Open a PR",
    description:
      "Work the way you always do. Every push and pull request triggers an automated AI review.",
  },
  {
    step: "03",
    title: "Get Instant AI Feedback",
    description:
      "Receive detailed findings with severity levels, file locations, and suggested fixes — right in your workflow.",
  },
  {
    step: "04",
    title: "Track & Improve Over Time",
    description:
      "Use the analytics dashboard to monitor trends, reduce risk scores, and continuously improve code quality.",
  },
];

const stats = [
  { value: "50K+", label: "Issues Detected", icon: Bug },
  { value: "10K+", label: "Repositories", icon: Github },
  { value: "5K+", label: "Developers", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Globe },
];

/* ------------------------------------------------------------------ */
/*  Landing Page Component                                            */
/* ------------------------------------------------------------------ */

const Landing = () => {
  const { user } = useAuth();

  // Fetch real platform stats
  const [platformStats, setPlatformStats] = useState({ totalReviews: 0, totalRepos: 0, totalUsers: 0 });
  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || "/api";
    fetch(`${BASE}/public/stats`)
      .then((r) => r.json())
      .then((d) => setPlatformStats(d))
      .catch(() => {});
  }, []);

  const dynamicStats = [
    { value: platformStats.totalReviews > 0 ? platformStats.totalReviews.toLocaleString() + "+" : "50K+", label: "Issues Detected", icon: Bug },
    { value: platformStats.totalRepos > 0 ? platformStats.totalRepos.toLocaleString() + "+" : "10K+", label: "Repositories", icon: Github },
    { value: platformStats.totalUsers > 0 ? platformStats.totalUsers.toLocaleString() + "+" : "5K+", label: "Developers", icon: Users },
    { value: "99.9%", label: "Uptime", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-base font-extrabold tracking-tight">
              CodeAurora <span className="text-primary">Sentinel AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#stats" className="hover:text-foreground transition-colors">
              Stats
            </a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-xl font-semibold gap-1.5">
                  Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login?signup=true">
                  <Button size="sm" className="rounded-xl font-semibold gap-1.5">
                    Get Started <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative isolate">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/10 blur-[120px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <SectionBadge>
              <Star className="h-3 w-3" /> AI-Powered Code Review Platform
            </SectionBadge>
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Catch Bugs Before
            <br />
            <span className="text-primary">They Catch You</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            CodeAurora Sentinel AI automatically reviews every commit and pull request,
            detecting security vulnerabilities, bugs, and code quality issues — so your team
            ships faster with confidence.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Link to={user ? "/dashboard" : "/login?signup=true"}>
              <Button size="lg" className="rounded-xl font-bold text-base px-8 gap-2 shadow-lg shadow-primary/20">
                Start Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="rounded-xl font-bold text-base px-8 gap-2">
                See How It Works <ChevronRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>

          {/* Hero illustration — code review card mockup */}
          <motion.div
            className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/40">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground font-mono">review-result.json</span>
            </div>
            <div className="p-5 sm:p-6 text-left font-mono text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-2 bg-card">
              <div>
                <span className="text-primary">{"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-emerald-500">"file"</span>: <span className="text-amber-500">"src/api/auth.ts"</span>,
              </div>
              <div className="pl-4">
                <span className="text-emerald-500">"severity"</span>: <span className="text-red-500">"critical"</span>,
              </div>
              <div className="pl-4">
                <span className="text-emerald-500">"issue"</span>: <span className="text-amber-500">"SQL Injection vulnerability detected"</span>,
              </div>
              <div className="pl-4">
                <span className="text-emerald-500">"suggestion"</span>: <span className="text-amber-500">"Use parameterized queries instead of string concatenation"</span>,
              </div>
              <div className="pl-4">
                <span className="text-emerald-500">"line"</span>: <span className="text-blue-400">42</span>
              </div>
              <div>
                <span className="text-primary">{"}"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── Stats bar ───── */}
      <section id="stats" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {dynamicStats.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionBadge>
              <Zap className="h-3 w-3" /> Features
            </SectionBadge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything You Need for <span className="text-primary">Secure Code</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From automated bug detection to full-stack security scanning, CodeAurora Sentinel AI gives your team superpowers.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <SectionBadge>
              <CheckCircle2 className="h-3 w-3" /> How It Works
            </SectionBadge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Up and Running in <span className="text-primary">Minutes</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              No complex setup, no configuration headaches. Just connect and go.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-sm"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <span className="text-4xl font-extrabold text-primary/15">{s.step}</span>
                <h3 className="mt-3 text-base font-bold text-card-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-5 -translate-y-1/2">
                    <ChevronRight className="h-5 w-5 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Ship <span className="text-primary">Safer Code</span>?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Join thousands of developers who trust CodeAurora Sentinel AI to protect their codebase.
              Get started for free — no credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/dashboard" : "/login?signup=true"}>
                <Button size="lg" className="rounded-xl font-bold text-base px-8 gap-2 shadow-lg shadow-primary/20">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-xl font-bold text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <ShieldCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">CodeAurora Sentinel AI</span>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} CodeAurora. All rights reserved.
              </p>
              <Link
                to="/admin/login"
                className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
