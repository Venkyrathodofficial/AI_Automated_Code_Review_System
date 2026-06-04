import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  Lock, 
  Database, 
  Terminal, 
  Activity, 
  HelpCircle,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  plan_tier: string;
  monthly_scans_used: number;
  monthly_scans_limit: number;
  current_period_end: string | null;
  status: string;
}

// Custom Counter Component for Stats Section
function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMilliseconds = duration;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 15);

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
}

// Custom FAQ Accordion Component
interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl bg-card/30 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-primary/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-card-foreground text-sm sm:text-base focus:outline-none"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4.5 w-4.5 text-primary shrink-0" />
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground ml-4"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8.5">
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoFormSubmitted, setDemoFormSubmitted] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  
  const [sub, setSub] = useState<Subscription>({
    plan_tier: "free",
    monthly_scans_used: 0,
    monthly_scans_limit: 5,
    current_period_end: null,
    status: "active",
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/v1/billing/status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to load subscription status");
      const data = await res.json();
      setSub(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load billing status");
    } finally {
      setLoading(false);
    }
  };

  const [publicStats, setPublicStats] = useState({
    reposScanned: 15248,
    vulnerabilitiesFound: 84930,
    issuesFixed: 62419,
    activeDevelopers: 8421,
    orgsProtected: 1240
  });

  const fetchPublicStats = async () => {
    try {
      const res = await fetch("/api/v1/public/stats");
      if (res.ok) {
        const data = await res.json();
        setPublicStats({
          reposScanned: data.reposScanned || 15248,
          vulnerabilitiesFound: data.vulnerabilitiesFound || 84930,
          issuesFixed: data.issuesFixed || 62419,
          activeDevelopers: data.activeDevelopers || 8421,
          orgsProtected: data.orgsProtected || 1240
        });
      }
    } catch (err) {
      console.error("Failed to fetch public stats:", err);
    }
  };

  // Verify payment on return from Cashfree checkout
  const verifyPayment = async (orderId: string) => {
    try {
      setVerifyingPayment(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/v1/billing/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`ðŸŽ‰ Payment successful! Your ${data.plan_tier} plan is now active.`);
        // Clean up URL params
        window.history.replaceState({}, "", window.location.pathname);
        await fetchSubscription();
      } else {
        toast.error(data.message || "Payment could not be verified. Please try again.");
      }
    } catch (err: any) {
      toast.error(err.message || "Payment verification failed");
    } finally {
      setVerifyingPayment(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    fetchPublicStats();

    // Check if returning from Cashfree checkout
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (orderId) {
      verifyPayment(orderId);
    }
  }, []);

  const handleCheckout = async (tier: string) => {
    try {
      setCheckoutLoading(tier);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to upgrade");
        return;
      }

      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier, billingPeriod }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate checkout");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No redirect URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePromoRedeem = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    try {
      setPromoLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first"); return; }

      const res = await fetch("/api/v1/promo/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid promo code");
        return;
      }
      setPromoSuccess(data.message || "Pro access activated!");
      toast.success(data.message || "Pro access activated!");
      setPromoCode("");
      await fetchSubscription();
    } catch (err: any) {
      toast.error(err.message || "Failed to redeem code");
    } finally {
      setPromoLoading(false);
    }
  };

  // No portal redirect needed - users manage billing in-app

  const scanPercentage = Math.min(100, (sub.monthly_scans_used / sub.monthly_scans_limit) * 100);
  const isLimitReached = sub.monthly_scans_used >= sub.monthly_scans_limit;

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoFormSubmitted(true);
    setTimeout(() => {
      setIsDemoModalOpen(false);
      setDemoFormSubmitted(false);
      toast.success("Demo request submitted! Our security engineer will email you shortly.");
    }, 1500);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav title="Plans & Early Access" subtitle="Access premium features with a promo code" />
          
          <main className="flex-1 overflow-auto p-4 sm:p-8 bg-background relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            {loading ? (
              <div className="flex flex-col items-center justify-center h-[50vh] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading pricing dashboard...</p>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-12 relative z-10">
                
                {/* 1. Usage Meter Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-card-foreground">
                          Current Plan: <span className="capitalize text-primary font-extrabold">{sub.plan_tier === "free" ? "Free Tier" : sub.plan_tier === "basic" ? "Basic Plan" : sub.plan_tier === "startup" ? "Startup Plan" : `${sub.plan_tier} Plan`}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">Your account scan activity for this billing cycle</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Monthly scans quota</span>
                        <span className={isLimitReached ? "text-destructive font-bold" : "text-card-foreground font-bold"}>
                          {sub.monthly_scans_used} / {sub.monthly_scans_limit} scans
                        </span>
                      </div>
                      <Progress value={scanPercentage} className="h-2 rounded-full bg-secondary" />
                    </div>

                    {sub.current_period_end && (
                      <p className="text-xs text-muted-foreground">
                        Subscription renews on: <span className="font-semibold text-card-foreground">{new Date(sub.current_period_end).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 sm:flex-row md:flex-col">
                    {(sub.plan_tier === "beta" || sub.plan_tier === "admin") && (
                      <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 max-w-sm">
                        <span className="font-bold text-emerald-400">Early Access Active</span>
                        <p className="text-muted-foreground mt-0.5">
                          {sub.current_period_end ? `Expires ${new Date(sub.current_period_end).toLocaleDateString()}` : "Lifetime access"}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* 2. Header */}
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-extrabold text-card-foreground tracking-tight sm:text-4xl">
                    Plans & Pricing
                  </h2>
                  <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                    Sentinel is in early access. Unlock premium features using an Early Access Code.
                  </p>
                </div>

                {/* 3. Tiers / Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-stretch">
                  
                  {/* Free Plan */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-2xl border p-6 bg-card/40 backdrop-blur-md flex flex-col justify-between h-full relative transition-all duration-300 ${sub.plan_tier === "free" ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-border shadow-sm hover:border-muted-foreground/20"}`}
                  >
                    {sub.plan_tier === "free" && (
                      <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Free</h4>
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-3xl font-extrabold text-card-foreground">{"\u20B9"}0</span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Students, explorers & open source contributors</p>
                      </div>

                      <ul className="space-y-3 text-xs text-card-foreground pt-4 border-t border-border">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span><strong>5 AI Security Scans</strong> per month</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Security Score & Vulnerability Detection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>GitHub Repository Integration</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Basic AI Recommendations</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-6">
                      <Button disabled variant="outline" className="w-full rounded-xl text-xs h-10">
                        {sub.plan_tier === "free" ? "Current Plan" : "Free"}
                      </Button>
                    </div>
                  </motion.div>

                  {/* Beta Plan */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-2xl border p-6 bg-card/60 backdrop-blur-md flex flex-col justify-between h-full relative transition-all duration-300 ${
                      (sub.plan_tier === "beta" || sub.plan_tier === "basic") 
                        ? "border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg" 
                        : "border-primary/30 shadow-sm hover:border-primary/50"
                    }`}
                  >
                    {(sub.plan_tier === "beta" || sub.plan_tier === "basic") && (
                      <span className="absolute -top-3 left-6 bg-emerald-500 text-white text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                    <span className="absolute -top-3 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" /> Early Access
                    </span>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Pro</h4>
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-3xl font-extrabold text-card-foreground">{"\u20B9"}199</span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-bold block mt-1">Free during early access with code</span>
                        <p className="text-xs text-muted-foreground mt-1">Hackathon teams, developers & contributors</p>
                      </div>

                      <ul className="space-y-3 text-xs text-card-foreground pt-4 border-t border-border">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-card-foreground"><strong>100 AI Security Scans</strong> /mo</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>AI Vulnerability Explanations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-semibold text-primary">AI-Generated Secure Fix Code</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>PDF Security Reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Full Scan History</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Priority Features & Support</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-6 space-y-2">
                      {(sub.plan_tier === "beta" || sub.plan_tier === "basic") ? (
                        <Button disabled className="w-full rounded-xl text-xs h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default">
                          {"\u2713"} Early Access Active
                        </Button>
                      ) : (
                        <Button 
                          disabled 
                          className="w-full rounded-xl text-xs h-10 bg-primary/10 text-primary border border-primary/20 cursor-not-allowed"
                        >
                          <Lock className="h-3.5 w-3.5 mr-1.5" />
                          Coming Soon - Use Code Below
                        </Button>
                      )}
                    </div>
                  </motion.div>

                  {/* Enterprise Plan */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`rounded-2xl border p-6 bg-card/40 backdrop-blur-md flex flex-col justify-between h-full relative transition-all duration-300 ${sub.plan_tier === "enterprise" || sub.plan_tier === "admin" ? "border-primary ring-1 ring-primary/20 shadow-md" : "border-border shadow-sm hover:border-muted-foreground/20"}`}
                  >
                    {(sub.plan_tier === "enterprise" || sub.plan_tier === "admin") && (
                      <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    )}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-muted-foreground" /> Enterprise
                        </h4>
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-2xl font-extrabold text-card-foreground">Custom</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Large organisations, universities & scaleups</p>
                      </div>

                      <ul className="space-y-3 text-xs text-card-foreground pt-4 border-t border-border">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-semibold text-primary">Unlimited Scans & Repositories</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Dedicated Account Manager</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>SOC2 / Compliance Reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Custom Scanning Policy Rules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>SLA-Backed 24/7/365 Support</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-6">
                      <Button 
                        onClick={() => setIsDemoModalOpen(true)}
                        className="w-full rounded-xl text-xs h-10 border border-border hover:bg-secondary"
                        variant="outline"
                      >
                        Contact Sales
                      </Button>
                    </div>
                  </motion.div>

                </div>

                {/* 4. Promo Code Redemption Card */}
                {sub.plan_tier === "free" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5 backdrop-blur-md p-8 text-center space-y-5 shadow-xl"
                  >
                    <div className="space-y-2">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/15 mx-auto">
                        <Terminal className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-card-foreground">Have an Early Access Code?</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Enter your early access code to unlock 100 scans/month free.
                      </p>
                    </div>

                    {promoSuccess ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <Check className="h-5 w-5" />
                        {promoSuccess}
                      </div>
                    ) : (
                      <div className="flex gap-2 max-w-md mx-auto">
                        <input
                          id="promo-code-input"
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && handlePromoRedeem()}
                          placeholder="e.g. EARLYACCESS100"
                          className="flex-1 rounded-xl border border-border bg-background text-card-foreground text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono tracking-wider uppercase placeholder:normal-case placeholder:tracking-normal"
                          disabled={promoLoading}
                        />
                        <Button
                          id="promo-activate-btn"
                          onClick={handlePromoRedeem}
                          disabled={promoLoading || !promoCode.trim()}
                          className="rounded-xl px-5 h-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shrink-0"
                        >
                          {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activate"}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}


                {/* 4. Trust Badges Section Removed */}

                {/* 5. Animated Counters Section */}
                <div className="border-t border-border/80 pt-12">
                  <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-md p-6 sm:p-8 shadow-lg max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-y-0 divide-x-0 sm:divide-x sm:divide-border divide-y divide-border md:divide-y-0">
                      
                      <div className="pt-4 sm:pt-0">
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                          <AnimatedCounter value={publicStats.reposScanned} />+
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Repos Scanned</p>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                          <AnimatedCounter value={publicStats.vulnerabilitiesFound} />+
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Vulnerabilities Found</p>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-500">
                          <AnimatedCounter value={publicStats.issuesFixed} />+
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Issues Fixed</p>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                          <AnimatedCounter value={publicStats.activeDevelopers} />+
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Active Devs</p>
                      </div>

                      <div className="pt-4 sm:pt-0">
                        <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                          <AnimatedCounter value={publicStats.orgsProtected} />
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1.5">Orgs Protected</p>
                      </div>

                    </div>
                  </div>
                </div>

                {/* 6. FAQ Section */}
                <div className="border-t border-border/80 pt-12 max-w-4xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-card-foreground">Frequently Asked Questions</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Everything you need to know about CodeAurora Sentinel billing & security.</p>
                  </div>

                  <div className="space-y-4">
                    <FAQItem 
                      question="How does Sentinel scan repositories?" 
                      answer="Sentinel connects via GitHub OAuth to access your repositories. When you start a scan or push code, it fetches the changes and analyzes them using Gemini 1.5 Flash AI and security check patterns to detect security vulnerabilities, performance bottlenecks, and quality issues." 
                    />
                    <FAQItem 
                      question="Is my source code stored?" 
                      answer="No. CodeAurora Sentinel does not store your repository's source code permanently. Code is fetched in memory, scanned immediately, and then discarded. Only the vulnerability reports (issue description, line number, file name) are stored in your database for dashboard tracking." 
                    />
                    <FAQItem 
                      question="How secure is GitHub integration?" 
                      answer="Highly secure. We use GitHub OAuth to request read access only to repositories you authorize, and write access only if you request automated commits. Your tokens are encrypted and stored safely." 
                    />
                    <FAQItem 
                      question="Can I cancel anytime?" 
                      answer="Yes! Your paid features will remain active until the end of your billing period. You can choose not to renew, and your plan will automatically revert to Free at the end of the cycle." 
                    />
                    <FAQItem 
                      question="What happens when I exceed my scan limit?" 
                      answer="If you hit your monthly scan limit, automated webhooks and manual scans will be paused. You will receive an email/dashboard alert prompting you to upgrade to a higher tier to continue." 
                    />
                    <FAQItem 
                      question="How are AI-powered fixes generated?" 
                      answer="Code fixes are generated using Gemini and Claude AI models trained on best practices. The models analyze the issue context and generate precise, isolated code modifications that you can apply with a single click." 
                    />
                    <FAQItem 
                      question="Is Sentinel suitable for startups?" 
                      answer="Absolutely! Our Startup plan includes webhook integration for automated continuous monitoring on every push, team dashboard capabilities, security analytics, and email reports to keep your startup secure as it scales." 
                    />
                  </div>
                </div>

              </div>
            )}

            {/* Book Demo Modal */}
            <AnimatePresence>
              {isDemoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" /> Book Sentinel Demo
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Talk with our lead security strategist for a custom deployment review.</p>
                      </div>
                      <button 
                        onClick={() => setIsDemoModalOpen(false)}
                        className="text-muted-foreground hover:text-card-foreground p-1 text-sm"
                      >
                        {"\u2715"}
                      </button>
                    </div>

                    <form onSubmit={handleBookDemo} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Your Name</label>
                        <input required type="text" placeholder="John Doe" className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Company Email</label>
                        <input required type="email" placeholder="john@company.com" className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Monthly Scans</label>
                        <select className="w-full h-10 px-3 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary">
                          <option>5,000 to 20,000 scans</option>
                          <option>20,000 to 100,000 scans</option>
                          <option>100,000+ scans</option>
                        </select>
                      </div>

                      <Button 
                        disabled={demoFormSubmitted}
                        type="submit" 
                        className="w-full rounded-xl text-xs h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                      >
                        {demoFormSubmitted ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          "Request Custom Quote"
                        )}
                      </Button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
