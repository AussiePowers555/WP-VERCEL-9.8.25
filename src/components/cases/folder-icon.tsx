"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Folder, 
  FolderOpen,
  Home,
  Inbox,
  Building2,
  Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FolderIconProps {
  id: string;
  name: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isSpecial?: boolean;
  isWorkspace?: boolean;
}

export function FolderIcon({
  id,
  name,
  count,
  isSelected,
  onClick,
  onContextMenu,
  isSpecial,
  isWorkspace
}: FolderIconProps) {
  // Get appropriate icon
  const getIcon = () => {
    if (id === 'all') {
      return isSelected ? <Home className="h-4 w-4" /> : <Home className="h-4 w-4" />;
    }
    if (id === 'unassigned') {
      return <Inbox className="h-4 w-4" />;
    }
    if (isWorkspace) {
      return isSelected ? <Building2 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />;
    }
    return isSelected ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors group",
        "hover:bg-accent",
        isSelected && "bg-accent font-medium"
      )}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "flex-shrink-0",
          isSpecial && "text-primary",
          isWorkspace && "text-blue-600 dark:text-blue-400"
        )}>
          {getIcon()}
        </div>
        <span className="truncate text-sm">{name}</span>
        {isWorkspace && (
          <Lock className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <Badge variant="secondary" className="ml-2">
        {count}
      </Badge>
    </div>
  );
}