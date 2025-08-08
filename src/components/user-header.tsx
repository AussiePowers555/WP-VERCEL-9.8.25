"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useSessionStorage } from "@/hooks/use-session-storage";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceName } from "@/components/workspace-name";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function UserHeader() {
  const { user, logout } = useAuth();
  const { name, role, backToMain } = useWorkspace();
  const router = useRouter();
  const { toast } = useToast();

  // Keyboard shortcut for Back to Main (Alt+M)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'm' && role === "admin" && name !== 'Main Workspace') {
        e.preventDefault();
        handleBackToMain();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [role, name]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  const handleBackToMain = () => {
    backToMain();
    toast({
      title: "Switched to Main Workspace",
      description: "Now viewing all cases across all workspaces."
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <WorkspaceName />
        {role === "admin" && name !== 'Main Workspace' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium"
                  onClick={handleBackToMain}
                  aria-label="Return to main workspace (Alt+M)"
                >
                  Back to Main
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Return to main workspace</p>
                <p className="text-xs text-muted-foreground">Alt+M</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {role === "admin" && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            Administrator
          </Badge>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://placehold.co/100x100" alt={user?.name} />
                <AvatarFallback>
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === "admin" && (
              <>
                <DropdownMenuItem onClick={() => router.push("/workspaces")}>
                  Manage Workspaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/contacts")}>
                  Manage Contacts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
