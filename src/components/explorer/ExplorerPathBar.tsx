import React from "react";
import { Folder, HardDrive } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface PathSegment {
  /** Unique identifier for the segment */
  id: string;
  /** Path represented by this segment */
  path: string;
  /** Display name of the segment */
  name: string;
  /** Whether this segment is a root/entry point */
  isRoot?: boolean;
  /** Optional custom icon override */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ExplorerPathBarProps {
  /** Array of segments to display in the breadcrumb */
  segments: PathSegment[];
  /** Callback when a non-last segment is clicked */
  onNavigate: (segment: PathSegment) => void;
  /** Optional additional class names for the container */
  className?: string;
}

export const ExplorerPathBar = ({
  segments,
  onNavigate,
  className,
}: ExplorerPathBarProps) => {
  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb 
      className={cn(
        "cursor-default select-none overflow-x-auto border-t border-border/60 bg-background/50 px-4 py-2",
        className
      )}
    >
      <BreadcrumbList className="flex-nowrap gap-1 text-xs">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const DefaultIcon = segment.isRoot ? HardDrive : Folder;
          const Icon = segment.icon || DefaultIcon;

          if (isLast) {
            return (
              <BreadcrumbItem key={segment.id}>
                <BreadcrumbPage className="inline-flex items-center gap-1.5 text-xs">
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      segment.isRoot ? "text-muted-foreground" : "text-primary",
                    )}
                  />
                  <span className="truncate">{segment.name}</span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            );
          }

          return (
            <React.Fragment key={segment.id}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    onClick={() => onNavigate(segment)}
                    className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted/60 outline-none"
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        segment.isRoot ? "text-muted-foreground" : "text-primary",
                      )}
                    />
                    <span className="truncate">{segment.name}</span>
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
