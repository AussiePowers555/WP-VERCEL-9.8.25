
'use client';

import { InteractionFeed } from '@/components/interactions/interaction-feed';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function InteractionsPage() {
  const { user } = useAuth();
  const workspace = useWorkspace();

  if (!user) {
    return null;
  }

  // Convert workspace ID - use user's workspace if in main workspace
  const workspaceId = workspace.id && workspace.id !== 'MAIN' 
    ? parseInt(workspace.id) 
    : user.workspaceId;

  return (
    <div className="container mx-auto px-4 py-6">
      <InteractionFeed 
        workspaceId={workspaceId} 
        showCreateForm={true}
        maxHeight="calc(100vh - 200px)"
      />
    </div>
  );
}

