import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  GitFork,
  Webhook,
  BarChart3,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const ONBOARDING_KEY = "ai_code_review_onboarding_done";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}

const tourSteps: TourStep[] = [
  {
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    title: "Welcome to CodeAurora Sentinel AI!",
    description:
      "Your intelligent code review assistant. We analyze every commit you push to GitHub, find security issues, bugs, and performance problems — all automatically.",
    highlight: "Let's get you set up in 3 simple steps.",
  },
  {
    icon: <GitFork className="h-8 w-8 text-primary" />,
    title: "Step 1: Connect a Repository",
    description:
      "Head to the Repositories page and click 'Connect Repository'. Enter your GitHub repo name (e.g. owner/repo) and we'll generate a unique webhook URL for you.",
    highlight: "Each repository gets its own webhook URL & secret.",
  },
  {
    icon: <Webhook className="h-8 w-8 text-primary" />,
    title: "Step 2: Set Up the Webhook",
    description:
      "Copy the webhook URL and secret we provide, then add them to your GitHub repo (Settings → Webhooks → Add webhook). Every push will trigger an automatic review.",
    highlight: "We verify webhook signatures for security.",
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-primary" />,
    title: "Step 3: Monitor Your Dashboard",
    description:
      "After your first push, reviews will appear on the Dashboard. Track stats, severity levels, and health scores for all your repositories in real time.",
    highlight: "Data refreshes automatically every 15 seconds.",
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "You're All Set!",
    description:
      "Your data is private — each user only sees their own connected repositories and reviews. Ready to connect your first repo?",
    highlight: "Let's get started!",
  },
];

export function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const key = `${ONBOARDING_KEY}_${user.id}`;
    const done = localStorage.getItem(key);
    if (!done) {
      setShow(true);
    }
  }, [user]);

  const handleClose = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    }
    setShow(false);
    setStep(0);
  };

  const handleFinish = () => {
    handleClose();
    navigate("/repositories");
  };

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;
  const isFirst = step === 0;

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header gradient */}
          <div className="relative h-44 bg-gradient-to-br from-primary/15 via-primary/8 to-emerald-50/50 dark:to-emerald-900/10 flex items-center justify-center">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-card shadow-lg border border-border p-4">
              {current.icon}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-xl"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Step indicators */}
            <div className="absolute bottom-4 flex items-center gap-2">
              {tourSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === step
                      ? "w-7 h-2 bg-primary"
                      : idx < step
                      ? "w-2 h-2 bg-primary/50"
                      : "w-2 h-2 bg-muted-foreground/25"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h2 className="text-lg font-extrabold text-foreground mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {current.description}
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {current.highlight}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-5 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => (isFirst ? handleClose() : setStep(step - 1))}
            >
              {isFirst ? (
                "Skip Tour"
              ) : (
                <>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back
                </>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground font-medium">
              {step + 1} of {tourSteps.length}
            </p>

            <Button
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => (isLast ? handleFinish() : setStep(step + 1))}
            >
              {isLast ? (
                <>
                  Connect Repo
                  <GitFork className="h-3.5 w-3.5 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
