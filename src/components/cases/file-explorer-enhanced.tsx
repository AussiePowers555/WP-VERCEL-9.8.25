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
  DragStartEvent,
  DragOverlay,
  Active,
  Over,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { FolderIcon } from "./folder-icon";
import { CaseIcon } from "./case-icon";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Grid3x3, 
  List, 
  FolderPlus,
  SortAsc,
  Filter,
  Key,
  User,
  Copy,
  Eye,
  EyeOff,
  Check
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { 
  CaseFrontend as Case,
  WorkspaceFrontend as Workspace 
} from "@/lib/database-schema";

interface Folder {
  id: string;
  name: string;
  isWorkspace: boolean;
  workspaceId?: string;
  caseIds: string[];
}

interface FileExplorerEnhancedProps {
  cases: Case[];
  workspaces: Workspace[];
  onCaseMove: (caseId: string, workspaceId: string | null) => Promise<void>;
  onCaseOpen: (caseId: string) => void;
  onWorkspaceCreate: (name: string, email: string, password: string) => Promise<{ id: string; email: string; password: string }>;
  onWorkspaceDelete: (workspaceId: string) => Promise<void>;
}

// Draggable Case Component
function DraggableCase({ 
  caseItem, 
  isSelected,
  onSelect,
  onOpen,
  viewMode = 'grid'
}: { 
  caseItem: Case;
  isSelected: boolean;
  onSelect: (multiSelect: boolean) => void;
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CaseIcon
        case={caseItem}
        isSelected={isSelected}
        onSelect={onSelect}
        onOpen={onOpen}
        onContextMenu={(e) => e.preventDefault()}
        viewMode={viewMode}
      />
    </div>
  );
}

// Droppable Folder Component
function DroppableFolder({
  folder,
  count,
  isSelected,
  onClick,
  onDrop,
  isOver,
}: {
  folder: Folder;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  onDrop: (caseIds: string[]) => void;
  isOver: boolean;
}) {
  const {
    setNodeRef,
    isOver: isDragOver,
  } = useSortable({ 
    id: folder.id,
    data: {
      type: 'folder',
      folder,
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`${isOver || isDragOver ? 'ring-2 ring-primary bg-accent' : ''} rounded-md transition-all`}
    >
      <FolderIcon
        id={folder.id}
        name={folder.name}
        count={count}
        isSelected={isSelected}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        isWorkspace={folder.isWorkspace}
      />
    </div>
  );
}

export function FileExplorerEnhanced({
  cases,
  workspaces,
  onCaseMove,
  onCaseOpen,
  onWorkspaceCreate,
  onWorkspaceDelete
}: FileExplorerEnhancedProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'number' | 'status'>('date');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);
  
  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [workspaceEmail, setWorkspaceEmail] = useState('');
  const [workspacePassword, setWorkspacePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [workspaceCredentials, setWorkspaceCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  // Initialize folders from workspaces
  useEffect(() => {
    const workspaceFolders: Folder[] = workspaces.map(ws => ({
      id: ws.id,
      name: ws.name,
      isWorkspace: true,
      workspaceId: ws.id,
      caseIds: cases.filter(c => c.workspaceId === ws.id).map(c => c.id),
    }));
    setFolders(workspaceFolders);
  }, [workspaces, cases]);

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

  // Filter cases based on selected folder
  const filteredCases = useMemo(() => {
    let filtered = cases;

    // Filter by folder
    if (selectedFolder === 'unassigned') {
      filtered = filtered.filter(c => !c.workspaceId);
    } else if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      if (folder?.isWorkspace) {
        filtered = filtered.filter(c => c.workspaceId === folder.workspaceId);
      } else if (folder) {
        filtered = filtered.filter(c => folder.caseIds.includes(c.id));
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.caseNumber?.toLowerCase().includes(query) ||
        c.clientName?.toLowerCase().includes(query) ||
        c.status?.toLowerCase().includes(query)
      );
    }

    // Sort cases
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'number':
          return a.caseNumber.localeCompare(b.caseNumber);
        case 'name':
          return a.clientName.localeCompare(b.clientName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'date':
        default:
          const aDate = new Date(a.lastUpdated).getTime();
          const bDate = new Date(b.lastUpdated).getTime();
          return bDate - aDate;
      }
    });

    return filtered;
  }, [cases, selectedFolder, searchQuery, sortBy, folders]);

  const unassignedCount = cases.filter(c => !c.workspaceId).length;

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveDragId(null);
      setOverFolderId(null);
      return;
    }

    const draggedCaseId = active.id as string;
    const targetId = over.id as string;
    
    // Check if dropped on a folder
    const targetFolder = folders.find(f => f.id === targetId);
    
    if (targetFolder) {
      // Move case to this folder/workspace
      if (targetFolder.isWorkspace && targetFolder.workspaceId) {
        await onCaseMove(draggedCaseId, targetFolder.workspaceId);
        toast({
          title: "Case Moved",
          description: `Case moved to ${targetFolder.name}`,
        });
      } else {
        // For non-workspace folders, just update local state
        setFolders(prev => prev.map(f => {
          if (f.id === targetFolder.id) {
            return { ...f, caseIds: [...f.caseIds, draggedCaseId] };
          }
          // Remove from other folders
          return { ...f, caseIds: f.caseIds.filter(id => id !== draggedCaseId) };
        }));
      }
    } else if (targetId === 'unassigned') {
      // Move to unassigned
      await onCaseMove(draggedCaseId, null);
      toast({
        title: "Case Moved",
        description: "Case moved to unassigned",
      });
    }

    setActiveDragId(null);
    setOverFolderId(null);
  };

  // Create new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      isWorkspace: false,
      caseIds: [],
    };

    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setShowCreateFolder(false);
    
    toast({
      title: "Folder Created",
      description: `Folder "${newFolderName}" has been created.`,
    });
  };

  // Convert folder to workspace
  const handleConvertToWorkspace = async () => {
    if (!targetFolderId || !workspaceEmail || !workspacePassword) return;

    const folder = folders.find(f => f.id === targetFolderId);
    if (!folder) return;

    try {
      // Create workspace with custom credentials
      const result = await onWorkspaceCreate(folder.name, workspaceEmail, workspacePassword);
      
      // Update folder to be a workspace
      setFolders(prev => prev.map(f => {
        if (f.id === targetFolderId) {
          return {
            ...f,
            isWorkspace: true,
            workspaceId: result.id,
          };
        }
        return f;
      }));

      // Move all cases in folder to the new workspace
      for (const caseId of folder.caseIds) {
        await onCaseMove(caseId, result.id);
      }

      setWorkspaceCredentials({ email: result.email, password: result.password });
      setShowCreateWorkspace(false);
      setShowCredentials(true);
      
      toast({
        title: "Workspace Created",
        description: `Workspace "${folder.name}" has been created with login credentials.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workspace. Please try again.",
      });
    }
  };

  // Handle folder context menu
  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    const folder = folders.find(f => f.id === folderId);
    
    if (folder && !folder.isWorkspace) {
      setTargetFolderId(folderId);
      setWorkspaceEmail(`admin@${folder.name.toLowerCase().replace(/\s+/g, '')}.com`);
      setWorkspacePassword('');
      setShowCreateWorkspace(true);
    }
  };

  // Get drag overlay content
  const getDragOverlay = () => {
    if (!activeDragId) return null;
    const draggedCase = cases.find(c => c.id === activeDragId);
    if (!draggedCase) return null;
    
    return (
      <div className="opacity-80 rotate-3 scale-105">
        <CaseIcon
          case={draggedCase}
          isSelected={false}
          onSelect={() => {}}
          onOpen={() => {}}
          onContextMenu={(e) => e.preventDefault()}
          viewMode="grid"
        />
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background">
        {/* Header Toolbar */}
        <div className="border-b p-4 space-y-3">
          <BreadcrumbNav 
            selectedFolder={selectedFolder}
            workspaces={workspaces}
            onNavigate={setSelectedFolder}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Last Updated</SelectItem>
                <SelectItem value="number">Case Number</SelectItem>
                <SelectItem value="name">Client Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Folders */}
          <div className="w-64 border-r p-4 overflow-y-auto">
            <SortableContext
              items={['all', 'unassigned', ...folders.map(f => f.id)]}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {/* All Cases */}
                <FolderIcon
                  id="all"
                  name="All Cases"
                  count={cases.length}
                  isSelected={selectedFolder === null}
                  onClick={() => setSelectedFolder(null)}
                  onContextMenu={(e) => e.preventDefault()}
                  isSpecial
                />

                {/* Unassigned Cases */}
                {unassignedCount > 0 && (
                  <DroppableFolder
                    folder={{
                      id: 'unassigned',
                      name: 'Unassigned',
                      isWorkspace: false,
                      caseIds: [],
                    }}
                    count={unassignedCount}
                    isSelected={selectedFolder === 'unassigned'}
                    onClick={() => setSelectedFolder('unassigned')}
                    onDrop={() => {}}
                    isOver={overFolderId === 'unassigned'}
                  />
                )}

                <div className="my-2 border-t" />

                {/* Custom Folders and Workspaces */}
                {folders.map(folder => {
                  const count = folder.isWorkspace 
                    ? cases.filter(c => c.workspaceId === folder.workspaceId).length
                    : folder.caseIds.length;
                  
                  return (
                    <div
                      key={folder.id}
                      onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
                    >
                      <DroppableFolder
                        folder={folder}
                        count={count}
                        isSelected={selectedFolder === folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        onDrop={() => {}}
                        isOver={overFolderId === folder.id}
                      />
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </div>

          {/* Cases Display */}
          <div className="flex-1 p-4 overflow-y-auto">
            <SortableContext
              items={filteredCases.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredCases.map(caseItem => (
                    <DraggableCase
                      key={caseItem.id}
                      caseItem={caseItem}
                      isSelected={selectedCases.has(caseItem.id)}
                      onSelect={(multiSelect) => {
                        setSelectedCases(prev => {
                          const newSet = new Set(prev);
                          if (multiSelect) {
                            if (newSet.has(caseItem.id)) {
                              newSet.delete(caseItem.id);
                            } else {
                              newSet.add(caseItem.id);
                            }
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
                  {filteredCases.map(caseItem => (
                    <DraggableCase
                      key={caseItem.id}
                      caseItem={caseItem}
                      isSelected={selectedCases.has(caseItem.id)}
                      onSelect={(multiSelect) => {
                        setSelectedCases(prev => {
                          const newSet = new Set(prev);
                          if (multiSelect) {
                            if (newSet.has(caseItem.id)) {
                              newSet.delete(caseItem.id);
                            } else {
                              newSet.add(caseItem.id);
                            }
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

            {filteredCases.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>No cases found</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
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
              Create a folder to organize your cases. You can convert it to a workspace later.
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

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Workspace</DialogTitle>
            <DialogDescription>
              Set up login credentials for this workspace. Users with these credentials will only see cases in this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workspace-email">Email Address</Label>
              <Input
                id="workspace-email"
                type="email"
                value={workspaceEmail}
                onChange={(e) => setWorkspaceEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="workspace-password">Password</Label>
              <div className="relative">
                <Input
                  id="workspace-password"
                  type={showPassword ? "text" : "password"}
                  value={workspacePassword}
                  onChange={(e) => setWorkspacePassword(e.target.value)}
                  placeholder="Enter a strong password"
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
            <Button variant="outline" onClick={() => setShowCreateWorkspace(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToWorkspace}
              disabled={!workspaceEmail || !workspacePassword || workspacePassword.length < 8}
            >
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Success Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workspace Created Successfully</DialogTitle>
            <DialogDescription>
              Save these credentials securely. They are required to access this workspace.
            </DialogDescription>
          </DialogHeader>
          {workspaceCredentials && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm">
                    {workspaceCredentials.email}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(workspaceCredentials.email);
                      toast({ title: "Email copied to clipboard" });
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
                    {workspaceCredentials.password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(workspaceCredentials.password);
                      toast({ title: "Password copied to clipboard" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Save these credentials now. You won't be able to see them again.
                </p>
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