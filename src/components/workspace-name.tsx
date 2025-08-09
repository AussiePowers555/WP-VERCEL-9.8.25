"use client";

import React from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AdminBadge } from "@/components/ui/admin-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function WorkspaceName() {
  const { name, role } = useWorkspace();

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <h1
              className={cn(
                "text-2xl font-semibold text-primary",
                "md:text-2xl",
                "max-w-[200px] md:max-w-none",
                "truncate"
              )}
              aria-label={`Current workspace: ${name}`}
            >
              {name}
            </h1>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-sm">{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {role === "admin" && <AdminBadge />}
    </div>
  );
}