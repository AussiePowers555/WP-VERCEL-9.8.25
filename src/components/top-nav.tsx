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
  Gem,
} from "lucide-react";

const mainNavItems = [
  { href: "/cases", label: "Case Management", icon: Briefcase, primary: true },
  { href: "/workspaces", label: "Workspaces", icon: LayoutGrid, primary: true, adminOnly: true },
  { href: "/fleet", label: "Fleet Management", icon: Bike, primary: true, adminOnly: true },
  { href: "/interactions", label: "Interactions", icon: MessageSquare, primary: true },
  { href: "/commitments", label: "Commitments", icon: ClipboardCheck, primary: true, adminOnly: true },
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
    <nav className="sticky top-0 z-50 w-full border-b border-navy-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <WhitePointerLogo className="text-navy-600" size="lg" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-navy-800">White Pointer</span>
            <span className="text-sm text-navy-500 -mt-1">Recovery App</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <div className="flex items-center gap-1">
          {filterNavItems(mainNavItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className={`
                    px-4 py-2 h-10 flex items-center gap-2 font-medium transition-all rounded-lg
                    ${isActive(item.href) 
                      ? "bg-navy-700 text-white hover:bg-navy-800 shadow-md border border-navy-600" 
                      : "text-navy-600 hover:text-navy-800 hover:bg-navy-50 border border-transparent"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}


          {/* Admin Menu Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="px-3 py-2 h-10 text-navy-600 hover:text-navy-800 hover:bg-navy-50 rounded-lg border border-transparent hover:border-navy-200"
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
                className={`
                  px-3 py-2 h-10 flex items-center gap-2
                  ${isActive("/settings") 
                    ? "bg-slate-800 text-white hover:bg-slate-700" 
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }
                `}
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}