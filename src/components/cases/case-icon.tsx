"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  User
} from "lucide-react";
import type { CaseFrontend as Case } from "@/lib/database-schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaseIconProps {
  case: Case;
  isSelected: boolean;
  onSelect: (multiSelect: boolean) => void;
  onOpen: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}

export function CaseIcon({
  case: caseItem,
  isSelected,
  onSelect,
  onOpen,
  onContextMenu,
  viewMode = 'grid'
}: CaseIconProps) {
  // Get status icon and color
  const getStatusIcon = () => {
    switch (caseItem.status) {
      case 'New Matter':
        return <AlertCircle className="h-3 w-3 text-blue-500" />;
      case 'Customer Contacted':
      case 'Awaiting Approval':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'Bike Delivered':
      case 'Bike Returned':
        return <AlertCircle className="h-3 w-3 text-orange-500" />;
      case 'Demands Sent':
      case 'Awaiting Settlement':
      case 'Settlement Agreed':
        return <Clock className="h-3 w-3 text-purple-500" />;
      case 'Paid':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'Closed':
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <FileText className="h-3 w-3 text-gray-400" />;
    }
  };

  // Get file color based on status
  const getFileColor = () => {
    switch (caseItem.status) {
      case 'New Matter':
        return 'text-blue-600 dark:text-blue-400';
      case 'Paid':
        return 'text-green-600 dark:text-green-400';
      case 'Closed':
        return 'text-gray-400 dark:text-gray-500';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - open case
      onOpen();
    } else {
      // Single click - select
      onSelect(e.ctrlKey || e.metaKey);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent",
          isSelected && "bg-accent ring-2 ring-primary ring-offset-2"
        )}
        onClick={handleClick}
        onContextMenu={onContextMenu}
      >
        <div className={cn("flex-shrink-0", getFileColor())}>
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{caseItem.caseNumber}</span>
            {getStatusIcon()}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {caseItem.clientName}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(caseItem.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-all",
              "hover:bg-accent hover:scale-105",
              isSelected && "bg-accent ring-2 ring-primary ring-offset-2"
            )}
            onClick={handleClick}
            onContextMenu={onContextMenu}
          >
            {/* File Icon */}
            <div className="relative">
              <FileText className={cn("h-12 w-12", getFileColor())} />
              {/* Status Badge */}
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                {getStatusIcon()}
              </div>
            </div>

            {/* Case Info */}
            <div className="text-center w-full">
              <div className="text-xs font-medium truncate">
                {caseItem.caseNumber}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {caseItem.clientName}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">{caseItem.caseNumber}</div>
            <div className="text-sm">Client: {caseItem.clientName}</div>
            <div className="text-sm">Status: {caseItem.status}</div>
            <div className="text-sm">
              Updated: {new Date(caseItem.lastUpdated).toLocaleString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}