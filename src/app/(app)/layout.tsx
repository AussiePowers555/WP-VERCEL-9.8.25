"use client";

import { ScrollArea } from "@/components/ui/scroll-area"
import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
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
        <div className="min-h-screen bg-background">
          <TopNav />
          <div className="flex flex-col">
            <UserHeader />
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
                {children}
              </main>
            </ScrollArea>
          </div>
        </div>
      </WorkspaceProvider>
    </AuthGuard>
  )
}
