"use client";

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
        <div className="min-h-screen bg-background flex flex-col">
          <TopNav />
          <UserHeader />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </WorkspaceProvider>
    </AuthGuard>
  )
}
