"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Nav } from "@/components/nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthGuard } from "@/components/auth-guard"
import { UserHeader } from "@/components/user-header"
import { WorkspaceProvider } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/context/AuthContext"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Determine the correct role based on user data
  const userRole = user?.role === 'admin' || user?.role === 'developer' ? 'admin' : 'workspace';
  
  return (
    <AuthGuard>
      <WorkspaceProvider 
        initialRole={userRole as 'admin' | 'workspace'}
        initialWorkspaceId={user?.workspaceId}
      >
        <SidebarProvider>
          <Sidebar>
            <Nav />
          </Sidebar>
          <SidebarInset>
            <UserHeader />
            <ScrollArea className="h-[calc(100vh-4rem)]">
              <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
            </ScrollArea>
          </SidebarInset>
        </SidebarProvider>
      </WorkspaceProvider>
    </AuthGuard>
  )
}
