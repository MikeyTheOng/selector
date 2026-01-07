import { AlertCircle, HardDrive } from "lucide-react";
import { TreeIcon, TreeLabel } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";
import type { CollectionItemStatus } from "../types";

type CollectionRowLabelProps = {
  name: string;
  type: "file" | "folder";
  status?: CollectionItemStatus;
  iconClassName?: string;
  labelClassName?: string;
};

export const CollectionRowLabel = ({
  name,
  type,
  status = "available",
  iconClassName,
  labelClassName,
}: CollectionRowLabelProps) => {
  let icon;
  if (status === "missing") {
    icon = <AlertCircle className="h-4 w-4" />;
  } else if (status === "offline") {
    icon = <HardDrive className="h-4 w-4" />;
  }

  return (
    <>
      <TreeIcon
        hasChildren={type === "folder"}
        className={iconClassName}
        icon={icon}
      />
      <TreeLabel
        className={cn("cursor-default select-text truncate", labelClassName)}
      >
        {name}
      </TreeLabel>
    </>
  );
};
