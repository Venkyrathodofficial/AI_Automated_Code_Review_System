import {
  ShieldCheck,
  LayoutDashboard,
  GitFork,
  AlertTriangle,
  Code2,
  PackageCheck,
  KeyRound,
  Box,
  Cloud,
  Network,
  Sparkles,
  GitPullRequest,
  Sliders,
  FileBarChart2,
  Building2,
  Puzzle,
  CreditCard,
  Settings,
  LogOut,
  LifeBuoy,
  Activity,
} from "lucide-react";
import { useRef, useLayoutEffect } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdmin";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Navigation Configuration
const workspaceMenu = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/repositories", icon: GitFork },
  { title: "Findings", url: "/issues", icon: AlertTriangle },
];

const enginesMenu = [
  { title: "Code Security", url: "/engines/code", icon: Code2, status: "Active" },
  { title: "Supply Chain", url: "/engines/supply-chain", icon: PackageCheck, status: "Active" },
  { title: "Secrets", url: "/engines/secrets", icon: KeyRound, status: "Active" },
  { title: "Container Security", url: "/engines/containers", icon: Box, status: "Planned" },
  { title: "Cloud & Infrastructure", url: "/engines/cloud", icon: Cloud, status: "Planned" },
  { title: "API Security", url: "/engines/api-security", icon: Network, status: "Planned" },
];

const workflowsMenu = [
  { title: "AI Security", url: "/workflows/ai-security", icon: Sparkles, status: "Active" },
  { title: "Pull Requests & CI/CD", url: "/workflows/pull-requests", icon: GitPullRequest, status: "Active" },
  { title: "Automation & Policies", url: "/workflows/policies", icon: Sliders, status: "Active" },
];

const insightsMenu = [
  { title: "Reports & Analytics", url: "/reports", icon: FileBarChart2 },
  { title: "Support & Incidents", url: "/incidents", icon: LifeBuoy },
];

const administrationMenu = [
  { title: "Organization", url: "/organization", icon: Building2 },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
];

// Module-level cache so scroll position survives component unmounts across page navigation
const SIDEBAR_SCROLL_KEY = "sentinel_app_sidebar_scroll";
let inMemorySidebarScrollTop = (() => {
  try {
    const val = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    return val ? parseFloat(val) : 0;
  } catch {
    return 0;
  }
})();

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { data: adminCheck } = useAdminCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    inMemorySidebarScrollTop = e.currentTarget.scrollTop;
    try {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(inMemorySidebarScrollTop));
    } catch {}
  };

  const handleCaptureClick = () => {
    if (contentRef.current) {
      inMemorySidebarScrollTop = contentRef.current.scrollTop;
      try {
        sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(inMemorySidebarScrollTop));
      } catch {}
    }
  };

  // Restore scroll position before paint whenever pathname changes
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // When on the main dashboard (/dashboard), always ensure sidebar is at the top
    if (location.pathname === "/dashboard") {
      inMemorySidebarScrollTop = 0;
      try {
        sessionStorage.removeItem(SIDEBAR_SCROLL_KEY);
      } catch {}
      el.scrollTop = 0;
      return;
    }

    if (inMemorySidebarScrollTop > 0) {
      el.scrollTop = inMemorySidebarScrollTop;
    }

    const rafId = requestAnimationFrame(() => {
      if (el) {
        if (location.pathname === "/dashboard") {
          el.scrollTop = 0;
        } else if (inMemorySidebarScrollTop > 0) {
          el.scrollTop = inMemorySidebarScrollTop;
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [location.pathname]);

  const handleLogout = async () => {
    inMemorySidebarScrollTop = 0;
    try {
      sessionStorage.removeItem(SIDEBAR_SCROLL_KEY);
    } catch {}
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent
        ref={contentRef}
        onScroll={handleScroll}
        onClickCapture={handleCaptureClick}
        className="bg-sidebar pt-5 flex flex-col overflow-y-auto"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 mb-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1">
              <div className="flex flex-col leading-[1.1]">
                <span className="text-[11px] font-bold tracking-tight text-foreground">CodeAurora</span>
                <span className="text-[11px] font-bold tracking-tight text-foreground">Sentinel</span>
              </div>
              <span className="text-[26px] font-black tracking-tighter text-primary leading-none -ml-0.5">AI</span>
            </div>
          )}
        </div>

        {/* 1. Workspace */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted font-semibold px-4 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 2. Security Engines */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted font-semibold px-4 mb-1">
            Security Engines
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {enginesMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </div>
                      {!collapsed && item.status === "Planned" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded border border-border/80 text-muted-foreground bg-muted/30 shrink-0">
                          Planned
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3. AI & Developer Workflows */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted font-semibold px-4 mb-1">
            AI & Workflows
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workflowsMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 4. Insights */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted font-semibold px-4 mb-1">
            Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightsMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 5. Administration */}
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-sidebar-muted font-semibold px-4 mb-1">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administrationMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {adminCheck?.isAdmin && (
                <SidebarMenuItem key="admin-portal">
                  <SidebarMenuButton asChild className="h-9">
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all duration-200"
                      activeClassName="bg-rose-600 text-white shadow-sm hover:bg-rose-600 hover:text-white"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-rose-500" />
                      {!collapsed && <span>Admin Mission Control</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto px-3 pb-4 pt-3 space-y-1">
          <Separator className="mb-2" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-medium text-sidebar-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
