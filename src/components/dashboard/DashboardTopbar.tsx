import { useNavigate } from "@tanstack/react-router";
import { LogOut, Search, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsBell } from "./NotificationsBell";
import { ThemeToggle } from "./ThemeToggle";

export function DashboardTopbar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (name || user?.email || "U")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center gap-3 px-4">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, orders, customers…"
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>
      <div className="flex-1 md:hidden" />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "Avatar"} /> : null}
                <AvatarFallback className="bg-gradient-brand text-brand-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{name || "Account"}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
              <UserIcon className="h-4 w-4" />
              Profile & settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
