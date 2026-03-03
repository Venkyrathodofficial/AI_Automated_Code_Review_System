import { Search, Bell, ChevronDown } from "lucide-react";
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
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        {title && (
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground leading-tight truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-muted-foreground hidden sm:block">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative w-40 sm:w-64 hidden md:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 pl-9 bg-secondary border-0 text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>

        <button className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-critical" />
        </button>

        <Separator orientation="vertical" className="h-5 hidden sm:block" />

        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground hidden sm:inline">{displayName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
