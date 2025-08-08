"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { WhitePointerLogo } from "./white-pointer-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  LayoutGrid,
  Bike,
  MessageSquare,
  ClipboardCheck,
  ChevronDown,
  Shield,
  Users,
  Settings,
  FileText,
  Contact,
  Mail,
  Banknote,
  Gem,
} from "lucide-react";

const mainNavItems = [
  { href: "/cases", label: "Case Management", icon: Briefcase, primary: true },
  { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, primary: true, adminOnly: true },
  { href: "/fleet", label: "Fleet Management", icon: Bike, primary: true, adminOnly: true },
  { href: "/interactions", label: "Interactions", icon: MessageSquare, primary: true },
  { href: "/commitments", label: "Commitments", icon: ClipboardCheck, primary: true, adminOnly: true },
];

const secondaryNavItems = [
  { href: "/contacts", label: "Contacts", icon: Contact, adminOnly: true },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/financials", label: "Financials", icon: Banknote, adminOnly: true },
  { href: "/ai-email", label: "AI Email", icon: Mail, adminOnly: true },
];

const adminNavItems = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: Gem },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function TopNav() {
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  const { role } = useWorkspace();
  const isAdmin = role === "admin";
  const isWorkspaceUser = role === "workspace" || currentUser?.role === "workspace_user";
  const pathname = usePathname();

  const filterNavItems = (items: typeof mainNavItems) => {
    return items.filter(item => {
      if (isWorkspaceUser) {
        // Workspace users can only see specific items
        return ['Case Management', 'Interactions', 'Documents'].includes(item.label);
      }
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    });
  };

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-navy-700/40 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 text-white shadow-md">
      <div className="flex h-14 items-center justify-start gap-4 px-3 lg:px-5">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <WhitePointerLogo className="text-white" size="lg" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold">White Pointer</span>
            <span className="text-[11px] text-white/80 -mt-0.5">Recovery App</span>
          </div>
        </Link>

        {/* Main Navigation aligned left, compact */}
        <div className="ml-2 flex items-center gap-1 flex-wrap">
          {filterNavItems(mainNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`
                    h-8 px-3 flex items-center gap-2 rounded-md transition-all border
                    ${isActive(item.href)
                      ? "bg-white text-navy-900 border-white/80 shadow"
                      : "text-white/90 hover:text-white hover:bg-white/10 border-transparent"}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">{item.label}</span>
                </Button>
              </Link>
            );
          })}

          {/* Secondary Menu Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 px-3 text-white/90 hover:text-white hover:bg-white/10 rounded-md border border-transparent"
                >
                  <span className="hidden sm:inline mr-1">More</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {filterNavItems(secondaryNavItems).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Admin Menu Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-8 px-3 text-white/90 hover:text-white hover:bg-white/10 rounded-md border border-transparent"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Admin</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Settings for all users */}
          {!isAdmin && (
            <Link href="/settings">
              <Button
                variant={isActive("/settings") ? "default" : "ghost"}
                className={`h-8 px-3 flex items-center gap-2 rounded-md border ${isActive("/settings") ? "bg-white text-navy-900 border-white/80" : "text-white/90 hover:text-white hover:bg-white/10 border-transparent"}`}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Settings</span>
              </Button>
            </Link>
          )}
        {/* Right side: Dark mode toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            id="theme-toggle"
            className="h-8 px-3 rounded-md text-white/90 hover:text-white hover:bg-white/10 border border-transparent"
            onClick={() => {
              const root = document.documentElement;
              root.classList.toggle('dark');
            }}
            aria-label="Toggle dark mode"
          >
            Dark mode
          </button>
        </div>
      </div>
    </nav>
  );
}