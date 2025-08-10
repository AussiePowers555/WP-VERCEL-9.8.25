"use client";

import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceFrontend as Workspace } from "@/lib/database-schema";

interface BreadcrumbNavProps {
  selectedFolder: string | null;
  workspaces: Workspace[];
  onNavigate: (folderId: string | null) => void;
}

export function BreadcrumbNav({
  selectedFolder,
  workspaces,
  onNavigate
}: BreadcrumbNavProps) {
  const getFolderName = () => {
    if (!selectedFolder) return null;
    if (selectedFolder === 'unassigned') return 'Unassigned';
    const workspace = workspaces.find(w => w.id === selectedFolder);
    return workspace?.name || 'Unknown';
  };

  const folderName = getFolderName();

  return (
    <div className="flex items-center gap-1 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-7 px-2"
      >
        <Home className="h-4 w-4 mr-1" />
        All Cases
      </Button>

      {folderName && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            disabled
          >
            {folderName}
          </Button>
        </>
      )}
    </div>
  );
}