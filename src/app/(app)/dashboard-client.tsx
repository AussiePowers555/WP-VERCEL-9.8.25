"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStorage } from '@/hooks/use-session-storage';

export default function DashboardClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser] = useSessionStorage<any>("currentUser", null);
  
  // Only admins and developers can see dashboard
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  
  useEffect(() => {
    // Redirect non-admins to interactions
    if (!isAdmin && currentUser) {
      router.replace('/interactions');
    }
  }, [isAdmin, currentUser, router]);
  
  // Show nothing while checking or redirecting
  if (!currentUser || !isAdmin) {
    return null;
  }
  
  // Show dashboard only for admins
  return <>{children}</>;
}