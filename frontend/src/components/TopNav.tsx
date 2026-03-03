import { useState, useRef, useEffect, useMemo } from "react";
import { Search, Bell, ChevronDown, MessageSquare, X, User, Settings, LogOut, AlertTriangle, GitFork, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useReviews } from "@/hooks/useReviews";
import { useNavigate } from "react-router-dom";

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: issues = [] } = useReviews();

  const meta = user?.user_metadata || {};
  const displayName = meta.full_name || meta.first_name || user?.email?.split("@")[0] || "User";
  const initials =
    ((meta.first_name?.[0] || displayName[0] || "").toUpperCase()) +
    ((meta.last_name?.[0] || "").toUpperCase() || "");
  const email = user?.email || "";

  // --- Search ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return issues.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.repository.toLowerCase().includes(q) ||
        i.fileName.toLowerCase().includes(q) ||
        i.severity.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, issues]);

  // Keyboard shortcut ⌘F / Ctrl+F
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  // --- Notifications ---
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    return issues
      .filter((i) => i.status === "open")
      .slice(0, 10)
      .map((i) => ({
        id: i.id,
        title: i.title,
        repo: i.repository,
        severity: i.severity,
        date: i.date,
      }));
  }, [issues]);

  const unreadCount = notifications.filter((n) => !readNotifs.has(n.id)).length;

  const markAllRead = () => {
    setReadNotifs(new Set(notifications.map((n) => n.id)));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // --- Messages (quick links to repos) ---
  const [msgOpen, setMsgOpen] = useState(false);
  const msgRef = useRef<HTMLDivElement>(null);

  const recentRepos = useMemo(() => {
    const seen = new Set<string>();
    return issues
      .filter((i) => {
        if (seen.has(i.repository)) return false;
        seen.add(i.repository);
        return true;
      })
      .slice(0, 5)
      .map((i) => ({ name: i.repository, issues: issues.filter((x) => x.repository === i.repository).length }));
  }, [issues]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) {
        setMsgOpen(false);
      }
    };
    if (msgOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [msgOpen]);

  // --- Profile dropdown ---
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await signOut();
    navigate("/login");
  };

  const severityDot: Record<string, string> = {
    critical: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        {title && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="relative w-44 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search issues, repos..."
              className="h-9 pl-10 pr-16 bg-background border-border text-xs rounded-xl placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
            />
            {searchQuery ? (
              <button
                onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘F
              </kbd>
            )}
          </div>

          {/* Search results dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No results for "{searchQuery}"
                </div>
              ) : (
                <div className="py-1.5">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-primary/[0.04] transition-colors text-left"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        navigate("/issues");
                      }}
                    >
                      <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${severityDot[r.severity] || "bg-muted"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-card-foreground truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">{r.repository} · {r.fileName}</p>
                      </div>
                    </button>
                  ))}
                  <Separator />
                  <button
                    className="w-full px-4 py-2 text-[11px] font-medium text-primary hover:bg-primary/[0.04] transition-colors text-center"
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); navigate("/issues"); }}
                  >
                    View all issues →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages / Repos quick access */}
        <div ref={msgRef} className="relative">
          <button
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => { setMsgOpen(!msgOpen); setNotifOpen(false); setProfileOpen(false); }}
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          {msgOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-72 bg-card border border-border rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-xs font-bold text-card-foreground">Repositories</h3>
                <p className="text-[10px] text-muted-foreground">Quick access to your repos</p>
              </div>
              {recentRepos.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No repositories connected yet
                </div>
              ) : (
                <div className="py-1.5">
                  {recentRepos.map((r) => (
                    <button
                      key={r.name}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/[0.04] transition-colors text-left"
                      onClick={() => { setMsgOpen(false); navigate("/repositories"); }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <GitFork className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-card-foreground truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.issues} issue{r.issues !== 1 ? "s" : ""}</p>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-border">
                <button
                  className="w-full px-4 py-2.5 text-[11px] font-medium text-primary hover:bg-primary/[0.04] transition-colors text-center"
                  onClick={() => { setMsgOpen(false); navigate("/repositories"); }}
                >
                  Manage repositories →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => { setNotifOpen(!notifOpen); setMsgOpen(false); setProfileOpen(false); }}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-card">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-80 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <h3 className="text-xs font-bold text-card-foreground">Notifications</h3>
                  <p className="text-[10px] text-muted-foreground">{unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No open issues — you're all clear!
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.map((n) => {
                      const isRead = readNotifs.has(n.id);
                      return (
                        <button
                          key={n.id}
                          className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-primary/[0.04] transition-colors text-left ${!isRead ? "bg-primary/[0.02]" : ""}`}
                          onClick={() => {
                            setReadNotifs((prev) => new Set(prev).add(n.id));
                            setNotifOpen(false);
                            navigate("/issues");
                          }}
                        >
                          <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${n.severity === "critical" ? "bg-red-100 dark:bg-red-900/20" : n.severity === "medium" ? "bg-amber-100 dark:bg-amber-900/20" : "bg-emerald-100 dark:bg-emerald-900/20"}`}>
                            <AlertTriangle className={`h-3.5 w-3.5 ${n.severity === "critical" ? "text-red-600 dark:text-red-400" : n.severity === "medium" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs truncate ${!isRead ? "font-semibold text-card-foreground" : "font-medium text-muted-foreground"}`}>{n.title}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{n.repo}</p>
                          </div>
                          {!isRead && <span className="mt-2 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-border">
                <button
                  className="w-full px-4 py-2.5 text-[11px] font-medium text-primary hover:bg-primary/[0.04] transition-colors text-center"
                  onClick={() => { setNotifOpen(false); navigate("/issues"); }}
                >
                  View all issues →
                </button>
              </div>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors"
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setMsgOpen(false); }}
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-foreground leading-tight">{displayName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{email}</p>
            </div>
            <ChevronDown className={`h-3 w-3 text-muted-foreground hidden sm:block transition-transform ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-56 bg-card border border-border rounded-xl shadow-lg z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold text-card-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{email}</p>
              </div>
              <div className="py-1.5">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-card-foreground hover:bg-primary/[0.04] transition-colors"
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  My Profile
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-card-foreground hover:bg-primary/[0.04] transition-colors"
                  onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                >
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Settings
                </button>
              </div>
              <div className="border-t border-border py-1.5">
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
