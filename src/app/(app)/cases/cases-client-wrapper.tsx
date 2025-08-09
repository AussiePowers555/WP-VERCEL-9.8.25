"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from '@/hooks/use-session-storage';

export default function CasesClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  
  const isWorkspaceUser = currentUser?.role === "workspace_user" || 
                         currentUser?.role === "rental_company" ||
                         currentUser?.role === "lawyer";
  
  useEffect(() => {
    // Redirect workspace users to interactions - they shouldn't see cases
    if (isWorkspaceUser) {
      router.replace('/interactions');
    }
  }, [isWorkspaceUser, router]);
  
  // Show nothing while redirecting
  if (isWorkspaceUser) {
    return null;
  }
  
  // Show cases for admins
  return <>{children}</>;
}