
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

  // Handle workspace ID - use workspace context if available, otherwise user's workspace
  let workspaceId: string | undefined;
  
  if (workspace.id && workspace.id !== 'MAIN') {
    workspaceId = workspace.id;
  } else {
    workspaceId = user.workspaceId;
  }

  console.log('[DEBUG] Interactions Page:', { 
    workspaceId: workspace.id, 
    userWorkspaceId: user.workspaceId, 
    finalWorkspaceId: workspaceId 
  });

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

