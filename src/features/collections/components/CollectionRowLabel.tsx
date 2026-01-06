import { TreeIcon, TreeLabel } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";

type CollectionRowLabelProps = {
  name: string;
  type: "file" | "folder";
  iconClassName?: string;
  labelClassName?: string;
};

export const CollectionRowLabel = ({
  name,
  type,
  iconClassName,
  labelClassName,
}: CollectionRowLabelProps) => {
  return (
    <>
      <TreeIcon hasChildren={type === "folder"} className={iconClassName} />
      <TreeLabel className={cn("cursor-default select-text truncate", labelClassName)}>
        {name}
      </TreeLabel>
    </>
  );
};
