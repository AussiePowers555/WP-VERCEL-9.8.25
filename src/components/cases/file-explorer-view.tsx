"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FolderIcon } from "./folder-icon";
import { CaseIcon } from "./case-icon";
import { ContextMenu } from "./context-menu";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Grid3x3, 
  List, 
  FolderPlus,
  SortAsc,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { 
  CaseFrontend as Case,
  WorkspaceFrontend as Workspace 
} from "@/lib/database-schema";

interface FileExplorerViewProps {
  cases: Case[];
  workspaces: Workspace[];
  onCaseMove: (caseId: string, workspaceId: string | null) => Promise<void>;
  onCaseOpen: (caseId: string) => void;
  onWorkspaceCreate: (name: string) => Promise<void>;
  onWorkspaceDelete: (workspaceId: string) => Promise<void>;
}

type ViewMode = 'grid' | 'list' | 'details';
type SortBy = 'name' | 'date' | 'status' | 'number';

export function FileExplorerView({
  cases,
  workspaces,
  onCaseMove,
  onCaseOpen,
  onWorkspaceCreate,
  onWorkspaceDelete
}: FileExplorerViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: 'folder' | 'case' | 'empty';
    id?: string;
  } | null>(null);

  // Filter cases based on selected folder
  const filteredCases = useMemo(() => {
    let filtered = cases;

    // Filter by folder/workspace
    if (selectedFolder === 'unassigned') {
      filtered = filtered.filter(c => !c.workspaceId);
    } else if (selectedFolder) {
      filtered = filtered.filter(c => c.workspaceId === selectedFolder);
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
  }, [cases, selectedFolder, searchQuery, sortBy]);

  // Get unassigned cases count
  const unassignedCount = cases.filter(c => !c.workspaceId).length;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedCases(new Set(filteredCases.map(c => c.id)));
      } else if (e.key === 'Escape') {
        setSelectedCases(new Set());
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCases]);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, target: 'folder' | 'case' | 'empty', id?: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target,
      id
    });
  };

  // Handle case selection
  const handleCaseSelect = (caseId: string, multiSelect: boolean) => {
    setSelectedCases(prev => {
      const newSet = new Set(prev);
      if (multiSelect) {
        if (newSet.has(caseId)) {
          newSet.delete(caseId);
        } else {
          newSet.add(caseId);
        }
      } else {
        newSet.clear();
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Toolbar */}
      <div className="border-b p-4 space-y-3">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav 
          selectedFolder={selectedFolder}
          workspaces={workspaces}
          onNavigate={setSelectedFolder}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Mode Toggle */}
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

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
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

          {/* New Folder */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const name = prompt('Enter folder name:');
              if (name) onWorkspaceCreate(name);
            }}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folders */}
        <div className="w-64 border-r p-4 overflow-y-auto">
          <div className="space-y-1">
            {/* All Cases */}
            <FolderIcon
              id="all"
              name="All Cases"
              count={cases.length}
              isSelected={selectedFolder === null}
              onClick={() => setSelectedFolder(null)}
              onContextMenu={(e) => handleContextMenu(e, 'folder', 'all')}
              isSpecial
            />

            {/* Unassigned Cases */}
            {unassignedCount > 0 && (
              <FolderIcon
                id="unassigned"
                name="Unassigned"
                count={unassignedCount}
                isSelected={selectedFolder === 'unassigned'}
                onClick={() => setSelectedFolder('unassigned')}
                onContextMenu={(e) => handleContextMenu(e, 'folder', 'unassigned')}
                isSpecial
              />
            )}

            <div className="my-2 border-t" />

            {/* Workspace Folders */}
            {workspaces.map(workspace => {
              const count = cases.filter(c => c.workspaceId === workspace.id).length;
              return (
                <FolderIcon
                  key={workspace.id}
                  id={workspace.id}
                  name={workspace.name}
                  count={count}
                  isSelected={selectedFolder === workspace.id}
                  onClick={() => setSelectedFolder(workspace.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'folder', workspace.id)}
                  isWorkspace
                />
              );
            })}
          </div>
        </div>

        {/* Cases Display Area */}
        <div 
          className="flex-1 p-4 overflow-y-auto"
          onContextMenu={(e) => handleContextMenu(e, 'empty')}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCases.map(caseItem => (
                <CaseIcon
                  key={caseItem.id}
                  case={caseItem}
                  isSelected={selectedCases.has(caseItem.id)}
                  onSelect={(multiSelect) => handleCaseSelect(caseItem.id, multiSelect)}
                  onOpen={() => onCaseOpen(caseItem.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'case', caseItem.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCases.map(caseItem => (
                <CaseIcon
                  key={caseItem.id}
                  case={caseItem}
                  isSelected={selectedCases.has(caseItem.id)}
                  onSelect={(multiSelect) => handleCaseSelect(caseItem.id, multiSelect)}
                  onOpen={() => onCaseOpen(caseItem.id)}
                  onContextMenu={(e) => handleContextMenu(e, 'case', caseItem.id)}
                  viewMode="list"
                />
              ))}
            </div>
          )}

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

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          targetId={contextMenu.id}
          workspaces={workspaces}
          selectedCases={Array.from(selectedCases)}
          onClose={() => setContextMenu(null)}
          onCaseMove={onCaseMove}
          onCaseOpen={onCaseOpen}
          onWorkspaceCreate={onWorkspaceCreate}
          onWorkspaceDelete={onWorkspaceDelete}
        />
      )}
    </div>
  );
}