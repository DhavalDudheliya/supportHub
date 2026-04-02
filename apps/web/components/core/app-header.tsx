"use client";

import { Bell, LogOut, Search, User } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@supporthub/ui/components/avatar";
import { Button } from "@supporthub/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@supporthub/ui/components/dropdown-menu";

import { useAuth } from "@/lib/auth-context";

/**
 * AppHeader — Top header bar for the authenticated app shell.
 *
 * Features:
 * - Global search input (placeholder for now)
 * - Notification bell with badge
 * - User profile dropdown (name, role, logout)
 */
export default function AppHeader() {
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "??";

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-6 justify-between">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tickets, customers, or articles... (Cmd+K)"
          aria-label="Search tickets, customers, or articles"
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted focus:outline-none">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-tight text-foreground">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role?.toLowerCase() ?? "Agent"}
              </p>
            </div>
            <Avatar>
              {user?.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={fullName} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
