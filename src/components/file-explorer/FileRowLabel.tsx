import { TreeIcon, TreeLabel } from "@/components/kibo-ui/tree";
import { cn } from "@/lib/utils";

type FileRowLabelProps = {
  name: string;
  type: "file" | "folder";
  iconClassName?: string;
  labelClassName?: string;
};

export const FileRowLabel = ({
  name,
  type,
  iconClassName,
  labelClassName,
}: FileRowLabelProps) => {
  return (
    <>
      <TreeIcon hasChildren={type === "folder"} className={iconClassName} />
      <TreeLabel className={cn("truncate", labelClassName)}>{name}</TreeLabel>
    </>
  );
};
