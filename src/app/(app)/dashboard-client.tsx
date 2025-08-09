"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from '@/hooks/use-session-storage';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  const { role } = useWorkspace();
  
  const isWorkspaceUser = role === 'workspace' || currentUser?.role === 'workspace_user';
  
  useEffect(() => {
    // Redirect workspace users to interactions (their feed)
    if (isWorkspaceUser) {
      router.replace('/interactions');
    }
  }, [isWorkspaceUser, router]);
  
  // Show nothing while redirecting
  if (isWorkspaceUser) {
    return null;
  }
  
  // Show dashboard for admins
  return <>{children}</>;
}