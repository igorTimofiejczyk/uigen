"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const fileName = path ? path.split("/").pop() : undefined;

    switch (command) {
      case "create":
        return fileName ? `Creating ${fileName}` : "Creating file";
      case "str_replace":
      case "insert":
        return fileName ? `Editing ${fileName}` : "Editing file";
      case "view":
        return fileName ? `Reading ${fileName}` : "Reading file";
      case "undo_edit":
        return fileName ? `Undoing edit in ${fileName}` : "Undoing edit";
      default:
        return fileName ? `Editing ${fileName}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const fileName = path ? path.split("/").pop() : undefined;

    switch (command) {
      case "rename":
        return fileName ? `Renaming ${fileName}` : "Renaming file";
      case "delete":
        return fileName ? `Deleting ${fileName}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const isDone = toolInvocation.state === "result" && toolInvocation.result != null;
  const label = getLabel(toolInvocation);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
