"use client";

import React, { ReactNode } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Loader2 } from 'lucide-react';

interface RequireWorkspaceProps {
  children: ReactNode;
}

export default function RequireWorkspace({ children }: RequireWorkspaceProps) {
  const { role, id, isLoading } = useWorkspace();

  // Show loading spinner while workspace context is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // For workspace users, ensure they have a workspace assigned
  if (role === 'workspace' && !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-4">
            You don't have access to any workspace. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Allow admin users to access without workspace (they can switch)
  // Allow workspace users with valid workspace ID
  return <>{children}</>;
}

// Full-page spinner component for consistency
export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}