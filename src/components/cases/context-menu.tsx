"use client";

import React, { useEffect, useState } from "react";
import { 
  FolderPlus,
  UserPlus,
  Copy,
  Trash2,
  FolderOpen,
  Eye,
  Edit,
  ArrowRight,
  Key,
  Mail,
  RefreshCw
} from "lucide-react";
import type { WorkspaceFrontend as Workspace } from "@/lib/database-schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContextMenuProps {
  x: number;
  y: number;
  target: 'folder' | 'case' | 'empty';
  targetId?: string;
  workspaces: Workspace[];
  selectedCases: string[];
  onClose: () => void;
  onCaseMove: (caseId: string, workspaceId: string | null) => Promise<void>;
  onCaseOpen: (caseId: string) => void;
  onWorkspaceCreate: (name: string) => Promise<void>;
  onWorkspaceDelete: (workspaceId: string) => Promise<void>;
}

export function ContextMenu({
  x,
  y,
  target,
  targetId,
  workspaces,
  selectedCases,
  onClose,
  onCaseMove,
  onCaseOpen,
  onWorkspaceCreate,
  onWorkspaceDelete
}: ContextMenuProps) {
  const { toast } = useToast();
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust menu position to stay within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 300),
    left: Math.min(x, window.innerWidth - 200),
    zIndex: 9999,
  };

  const handleCreateWorkspace = async () => {
    if (targetId === 'all' || targetId === 'unassigned') return;
    
    const name = prompt('Enter workspace name:');
    if (!name) return;

    await onWorkspaceCreate(name);
    toast({
      title: "Workspace Created",
      description: `Workspace "${name}" has been created.`,
    });
    onClose();
  };

  const handleConvertToWorkspace = async () => {
    if (!targetId || targetId === 'all' || targetId === 'unassigned') return;

    // Generate credentials
    const email = `user_${Date.now()}@workspace.local`;
    const password = Math.random().toString(36).slice(-8) + 'A1!';

    setCredentials({ email, password });
    setShowCredentials(true);

    toast({
      title: "Workspace Configured",
      description: "Login credentials have been generated.",
    });
  };

  const handleViewCredentials = () => {
    if (!targetId || targetId === 'all' || targetId === 'unassigned') return;

    // In real implementation, fetch credentials from database
    const workspace = workspaces.find(w => w.id === targetId);
    if (workspace) {
      // Mock credentials for demo
      setCredentials({
        email: `admin@${workspace.name.toLowerCase().replace(/\s+/g, '')}.com`,
        password: 'TempPassword123!'
      });
      setShowCredentials(true);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!targetId || targetId === 'all' || targetId === 'unassigned') return;

    if (confirm('Are you sure you want to delete this workspace?')) {
      await onWorkspaceDelete(targetId);
      toast({
        variant: "destructive",
        title: "Workspace Deleted",
        description: "The workspace has been removed.",
      });
      onClose();
    }
  };

  const handleMoveToWorkspace = async (workspaceId: string | null) => {
    for (const caseId of selectedCases) {
      await onCaseMove(caseId, workspaceId);
    }
    toast({
      title: "Cases Moved",
      description: `${selectedCases.length} case(s) have been moved.`,
    });
    onClose();
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger = false }: any) => (
    <div
      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent rounded-sm ${
        danger ? 'text-destructive hover:bg-destructive/10' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );

  const Separator = () => <div className="h-px bg-border my-1" />;

  return (
    <>
      <div
        style={menuStyle}
        className="bg-popover border rounded-md shadow-lg p-1 min-w-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Folder Context Menu */}
        {target === 'folder' && targetId && (
          <>
            {targetId !== 'all' && targetId !== 'unassigned' && (
              <>
                <MenuItem icon={FolderOpen} label="Open" onClick={() => {}} />
                <MenuItem icon={Key} label="View Login Credentials" onClick={handleViewCredentials} />
                <MenuItem icon={UserPlus} label="Create User Account" onClick={handleConvertToWorkspace} />
                <Separator />
                <MenuItem icon={Edit} label="Rename" onClick={() => {}} />
                <MenuItem icon={RefreshCw} label="Refresh" onClick={() => {}} />
                <Separator />
                <MenuItem icon={Trash2} label="Delete" onClick={handleDeleteWorkspace} danger />
              </>
            )}
            {(targetId === 'all' || targetId === 'unassigned') && (
              <MenuItem icon={FolderPlus} label="New Workspace" onClick={handleCreateWorkspace} />
            )}
          </>
        )}

        {/* Case Context Menu */}
        {target === 'case' && targetId && (
          <>
            <MenuItem icon={FolderOpen} label="Open" onClick={() => {
              onCaseOpen(targetId);
              onClose();
            }} />
            <MenuItem icon={Eye} label="View Details" onClick={() => {
              onCaseOpen(targetId);
              onClose();
            }} />
            <Separator />
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Move to</div>
            <MenuItem icon={ArrowRight} label="Unassigned" onClick={() => handleMoveToWorkspace(null)} />
            {workspaces.map(workspace => (
              <MenuItem
                key={workspace.id}
                icon={ArrowRight}
                label={workspace.name}
                onClick={() => handleMoveToWorkspace(workspace.id)}
              />
            ))}
            <Separator />
            <MenuItem icon={Copy} label="Duplicate" onClick={() => {}} />
            <MenuItem icon={Trash2} label="Delete" onClick={() => {}} danger />
          </>
        )}

        {/* Empty Area Context Menu */}
        {target === 'empty' && (
          <>
            <MenuItem icon={FolderPlus} label="New Folder" onClick={handleCreateWorkspace} />
            <MenuItem icon={RefreshCw} label="Refresh" onClick={() => {
              window.location.reload();
            }} />
          </>
        )}
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Login Credentials</DialogTitle>
            <DialogDescription>
              Save these credentials securely. They will be needed to access this workspace.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {credentials.email}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.email);
                      toast({ title: "Copied to clipboard" });
                    }}
                    className="p-2 hover:bg-accent rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {credentials.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.password);
                      toast({ title: "Copied to clipboard" });
                    }}
                    className="p-2 hover:bg-accent rounded"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}