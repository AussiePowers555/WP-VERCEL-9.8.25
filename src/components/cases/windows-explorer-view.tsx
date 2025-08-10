"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Grid3x3, 
  List, 
  FolderPlus,
  Folder,
  FolderOpen,
  File,
  Eye,
  EyeOff,
  Check,
  Copy,
  UserPlus,
  Trash2,
  RefreshCw,
  ChevronRight,
  Home,
  MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { 
  CaseFrontend as Case,
  WorkspaceFrontend as Workspace 
} from "@/lib/database-schema";

interface WindowsExplorerViewProps {
  cases: Case[];
  workspaces: Workspace[];
  onCaseMove: (caseId: string, workspaceId: string | null) => Promise<void>;
  onCaseOpen: (caseId: string) => void;
  onWorkspaceCreate: (name: string, email: string, password: string) => Promise<{ id: string; email: string; password: string }>;
  onWorkspaceDelete: (workspaceId: string) => Promise<void>;
}

// Draggable Case Item
function DraggableCase({ 
  caseItem, 
  isSelected,
  onSelect,
  onOpen,
  viewMode = 'grid'
}: { 
  caseItem: Case;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  viewMode?: 'grid' | 'list';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: caseItem.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColors: Record<string, string> = {
    'New Matter': 'text-blue-600',
    'Customer Contacted': 'text-yellow-600',
    'Awaiting Approval': 'text-orange-600',
    'Bike Delivered': 'text-green-600',
    'Bike Returned': 'text-purple-600',
    'Demands Sent': 'text-red-600',
    'Awaiting Settlement': 'text-pink-600',
    'Settlement Agreed': 'text-indigo-600',
    'Paid': 'text-green-700',
    'Closed': 'text-gray-600'
  };

  if (viewMode === 'list') {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
          isSelected && "bg-accent"
        )}
        onClick={onSelect}
        onDoubleClick={onOpen}
      >
        <File className={cn("h-4 w-4", statusColors[caseItem.status])} />
        <span className="flex-1 text-sm">{caseItem.caseNumber}</span>
        <span className="text-xs text-muted-foreground">{caseItem.clientName}</span>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
      onClick={onSelect}
      onDoubleClick={onOpen}
    >
      <File className={cn("h-12 w-12", statusColors[caseItem.status])} />
      <span className="text-xs text-center break-all">{caseItem.caseNumber}</span>
      <span className="text-[10px] text-muted-foreground text-center truncate w-full">
        {caseItem.clientName}
      </span>
    </div>
  );
}

// Droppable Folder
function DroppableFolder({
  workspace,
  count,
  isSelected,
  onOpen,
  viewMode = 'grid'
}: {
  workspace: Workspace;
  count: number;
  isSelected: boolean;
  onOpen: () => void;
  viewMode?: 'grid' | 'list';
}) {
  const {
    setNodeRef,
    isOver,
  } = useSortable({ 
    id: workspace.id,
    data: {
      type: 'folder',
      workspace,
    }
  });

  if (viewMode === 'list') {
    return (
      <div 
        ref={setNodeRef}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-accent",
          isSelected && "bg-accent",
          isOver && "ring-2 ring-primary bg-accent"
        )}
        onDoubleClick={onOpen}
      >
        {isSelected ? <FolderOpen className="h-4 w-4 text-blue-600" /> : <Folder className="h-4 w-4 text-blue-600" />}
        <span className="flex-1 text-sm">{workspace.name}</span>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
    );
  }

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
        isSelected && "bg-accent",
        isOver && "ring-2 ring-primary bg-accent"
      )}
      onDoubleClick={onOpen}
    >
      {isSelected ? 
        <FolderOpen className="h-12 w-12 text-blue-600" /> : 
        <Folder className="h-12 w-12 text-blue-600" />
      }
      <span className="text-xs text-center break-all">{workspace.name}</span>
      <Badge variant="secondary" className="text-[10px]">{count}</Badge>
    </div>
  );
}

export function WindowsExplorerView({
  cases,
  workspaces,
  onCaseMove,
  onCaseOpen,
  onWorkspaceCreate,
  onWorkspaceDelete
}: WindowsExplorerViewProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showShareFolder, setShowShareFolder] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState<Workspace | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sharedCredentials, setSharedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get current folder's cases
  const currentFolderCases = useMemo(() => {
    if (!selectedFolder) {
      // Show all workspaces and unassigned cases at root
      return cases.filter(c => !c.workspaceId);
    }
    
    // Show cases in selected workspace
    return cases.filter(c => c.workspaceId === selectedFolder);
  }, [cases, selectedFolder]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return currentFolderCases;
    
    const query = searchQuery.toLowerCase();
    return currentFolderCases.filter(c => 
      c.caseNumber?.toLowerCase().includes(query) ||
      c.clientName?.toLowerCase().includes(query) ||
      c.status?.toLowerCase().includes(query)
    );
  }, [currentFolderCases, searchQuery]);

  // Get current workspace
  const currentWorkspace = selectedFolder ? 
    workspaces.find(w => w.id === selectedFolder) : null;

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveDragId(null);
      return;
    }

    const draggedCaseId = active.id as string;
    const targetId = over.id as string;
    
    // Check if dropped on a workspace folder
    const targetWorkspace = workspaces.find(w => w.id === targetId);
    
    if (targetWorkspace) {
      await onCaseMove(draggedCaseId, targetWorkspace.id);
      toast({
        title: "Case Moved",
        description: `Case moved to ${targetWorkspace.name}`,
      });
    }

    setActiveDragId(null);
  };

  // Create new folder (workspace)
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    // Generate default credentials
    const defaultEmail = `admin@${newFolderName.toLowerCase().replace(/\s+/g, '')}.com`;
    const defaultPassword = Math.random().toString(36).slice(-8) + 'A1!';

    try {
      const result = await onWorkspaceCreate(newFolderName, defaultEmail, defaultPassword);
      
      setNewFolderName('');
      setShowCreateFolder(false);
      
      toast({
        title: "Folder Created",
        description: `Folder "${newFolderName}" has been created.`,
      });
      
      // Refresh to show new workspace
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder. Please try again.",
      });
    }
  };

  // Share folder (set login credentials)
  const handleShareFolder = async () => {
    if (!targetWorkspace || !shareEmail || !sharePassword) return;

    try {
      // Call API to create user with workspace access
      const response = await fetch('/api/workspaces/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: targetWorkspace.id,
          email: shareEmail,
          password: sharePassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share folder');
      }

      const result = await response.json();
      
      // Show credentials to user
      setSharedCredentials({ email: shareEmail, password: sharePassword });
      setShowShareFolder(false);
      setShowCredentials(true);
      
      if (result.isExistingUser) {
        toast({
          title: "Folder Access Updated",
          description: `${shareEmail} now has access to ${targetWorkspace.name}.`,
        });
      } else {
        toast({
          title: "Folder Shared Successfully",
          description: `New user created with access to ${targetWorkspace.name}.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share folder. Please try again.",
      });
    }
  };

  // Handle folder context menu
  const handleFolderContextMenu = (workspace: Workspace) => {
    setTargetWorkspace(workspace);
    setShareEmail(`user@${workspace.name.toLowerCase().replace(/\s+/g, '')}.com`);
    setSharePassword('');
    setShowShareFolder(true);
  };

  // Get drag overlay content
  const getDragOverlay = () => {
    if (!activeDragId) return null;
    const draggedCase = cases.find(c => c.id === activeDragId);
    if (!draggedCase) return null;
    
    return (
      <div className="opacity-80 rotate-3 scale-105">
        <File className="h-12 w-12 text-blue-600" />
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveDragId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background">
        {/* Toolbar */}
        <div className="border-b p-3 space-y-2">
          {/* Navigation Bar */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFolder(null)}
              className="h-7 px-2"
            >
              <Home className="h-4 w-4" />
            </Button>
            {currentWorkspace && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{currentWorkspace.name}</span>
              </>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none h-8"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 overflow-auto">
          <SortableContext
            items={[...workspaces.map(w => w.id), ...filteredItems.map(c => c.id)]}
            strategy={verticalListSortingStrategy}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {/* Show workspaces as folders when at root */}
                {!selectedFolder && workspaces.map(workspace => {
                  const count = cases.filter(c => c.workspaceId === workspace.id).length;
                  return (
                    <ContextMenu key={workspace.id}>
                      <ContextMenuTrigger>
                        <DroppableFolder
                          workspace={workspace}
                          count={count}
                          isSelected={false}
                          onOpen={() => setSelectedFolder(workspace.id)}
                          viewMode="grid"
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => setSelectedFolder(workspace.id)}>
                          Open
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFolderContextMenu(workspace)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Share Folder...
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => window.location.reload()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => onWorkspaceDelete(workspace.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}

                {/* Show cases */}
                {filteredItems.map(caseItem => (
                  <DraggableCase
                    key={caseItem.id}
                    caseItem={caseItem}
                    isSelected={selectedCases.has(caseItem.id)}
                    onSelect={() => {
                      setSelectedCases(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(caseItem.id)) {
                          newSet.delete(caseItem.id);
                        } else {
                          newSet.clear();
                          newSet.add(caseItem.id);
                        }
                        return newSet;
                      });
                    }}
                    onOpen={() => onCaseOpen(caseItem.id)}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {/* Show workspaces as folders when at root */}
                {!selectedFolder && workspaces.map(workspace => {
                  const count = cases.filter(c => c.workspaceId === workspace.id).length;
                  return (
                    <ContextMenu key={workspace.id}>
                      <ContextMenuTrigger>
                        <DroppableFolder
                          workspace={workspace}
                          count={count}
                          isSelected={false}
                          onOpen={() => setSelectedFolder(workspace.id)}
                          viewMode="list"
                        />
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => setSelectedFolder(workspace.id)}>
                          Open
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleFolderContextMenu(workspace)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Share Folder...
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => window.location.reload()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                          onClick={() => onWorkspaceDelete(workspace.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}

                {/* Show cases */}
                {filteredItems.map(caseItem => (
                  <DraggableCase
                    key={caseItem.id}
                    caseItem={caseItem}
                    isSelected={selectedCases.has(caseItem.id)}
                    onSelect={() => {
                      setSelectedCases(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(caseItem.id)) {
                          newSet.delete(caseItem.id);
                        } else {
                          newSet.clear();
                          newSet.add(caseItem.id);
                        }
                        return newSet;
                      });
                    }}
                    onOpen={() => onCaseOpen(caseItem.id)}
                    viewMode="list"
                  />
                ))}
              </div>
            )}
          </SortableContext>

          {filteredItems.length === 0 && !selectedFolder && workspaces.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Folder className="h-12 w-12 mb-2" />
              <p>No folders yet</p>
              <Button
                variant="link"
                onClick={() => setShowCreateFolder(true)}
                className="mt-2"
              >
                Create your first folder
              </Button>
            </div>
          )}

          {filteredItems.length === 0 && selectedFolder && (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <File className="h-12 w-12 mb-2" />
              <p>This folder is empty</p>
              <p className="text-sm mt-2">Drag cases here to organize them</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {getDragOverlay()}
      </DragOverlay>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a folder to organize your cases. You can share it with others later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Folder Dialog */}
      <Dialog open={showShareFolder} onOpenChange={setShowShareFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Folder: {targetWorkspace?.name}</DialogTitle>
            <DialogDescription>
              Set up login credentials to share this folder with others. They will only see cases in this folder.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-email">Email Address</Label>
              <Input
                id="share-email"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="share-password">Password</Label>
              <div className="relative">
                <Input
                  id="share-password"
                  type={showPassword ? "text" : "password"}
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="Enter a password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareFolder(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareFolder}
              disabled={!shareEmail || !sharePassword || sharePassword.length < 8}
            >
              Share Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Folder Shared Successfully</DialogTitle>
            <DialogDescription>
              Share these credentials with the user who needs access to this folder.
            </DialogDescription>
          </DialogHeader>
          {sharedCredentials && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {sharedCredentials.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(sharedCredentials.email);
                      toast({ title: "Email copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {sharedCredentials.password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(sharedCredentials.password);
                      toast({ title: "Password copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCredentials(false)}>
              <Check className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}