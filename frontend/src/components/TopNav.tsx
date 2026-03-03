import { Search, Bell, ChevronDown, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

interface TopNavProps {
  title?: string;
  subtitle?: string;
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const { user } = useAuth();
  const meta = user?.user_metadata || {};
  const displayName = meta.full_name || meta.first_name || user?.email?.split("@")[0] || "User";
  const initials =
    ((meta.first_name?.[0] || displayName[0] || "").toUpperCase()) +
    ((meta.last_name?.[0] || "").toUpperCase() || "");
  const email = user?.email || "";

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
        <div className="relative w-44 sm:w-72 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search issues, repos..."
            className="h-9 pl-10 bg-background border-border text-xs rounded-xl placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘F
          </kbd>
        </div>

        <button className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <MessageSquare className="h-4 w-4" />
        </button>

        <button className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical ring-2 ring-card" />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-accent transition-colors">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary text-primary-foreground text-[11px] font-bold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-foreground leading-tight">{displayName}</p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{email}</p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
