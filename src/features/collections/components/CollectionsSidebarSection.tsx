import React, { useState, useEffect } from "react";
import { FolderPlus } from "lucide-react";
import { useCollections } from "../hooks/use-collections";
import { useNavigation } from "@/hooks/use-navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExplorerContextMenu } from "@/components/explorer/ExplorerContextMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
export const CollectionsSidebarSection: React.FC = () => {
  const {
    collections,
    isLoading,
    error,
    updateCollection,
    deleteCollection,
    refetch,
  } = useCollections();
  const { currentRoute, navigateToCollection, navigateToExplorer } =
    useNavigation();

  const selectedCollectionId =
    currentRoute.type === "collection"
      ? parseInt(currentRoute.collectionId, 10)
      : null;

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<number | null>(null);
  const [newName, setNewName] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse">
        Loading collections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-xs text-destructive">
        Error loading collections
      </div>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  const openRename = (id: number, currentName: string) => {
    setRenameTarget(id);
    setNewName(currentName);
    setRenameOpen(true);
  };

  const openDelete = (id: number) => {
    setDeleteTarget(id);
    setDeleteOpen(true);
  };

  const handleRename = async (newNameParam?: string) => {
    if (renameTarget === null) return;
    const nameToUse = newNameParam ?? newName.trim();
    try {
      await updateCollection({ id: renameTarget, name: nameToUse });
      toast.success("Collection renamed");
      setRenameOpen(false);
      refetch();
    } catch {
      toast.error("Failed to rename collection");
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteCollection(deleteTarget);
      toast.success("Collection deleted");
      setDeleteOpen(false);
      refetch();
      if (selectedCollectionId === deleteTarget) {
        navigateToExplorer(null);
      }
    } catch {
      toast.error("Failed to delete collection");
    }
  };

  return (
    <div>
      <p className="cursor-default select-none px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Collections
      </p>
      <div className="flex flex-col gap-0.5">
        {collections.map((collection) => (
          <CollectionButton
            key={collection.id}
            collection={collection}
            isSelected={selectedCollectionId === collection.id}
            onSelect={() => navigateToCollection(collection.id.toString())}
            onRename={() => openRename(collection.id, collection.name)}
            onDelete={() => openDelete(collection.id)}
          />
        ))}
      </div>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={newName}
        onConfirm={(value) => {
          setNewName(value);
          handleRename(value);
        }}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
};

function CollectionButton({
  collection,
  isSelected,
  onSelect,
  onRename,
  onDelete,
}: {
  collection: { id: number; name: string };
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { showContextMenu } = useExplorerContextMenu();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        showContextMenu([
          {
            type: "item" as const,
            id: "rename",
            text: "Rename",
            action: onRename,
          },
          {
            type: "item" as const,
            id: "delete",
            text: "Delete",
            action: onDelete,
          },
        ]);
      }}
      className={cn(
        "h-auto w-full justify-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:text-foreground",
        isSelected
          ? "bg-accent/70 text-foreground"
          : "text-foreground hover:bg-muted/50",
      )}
    >
      <FolderPlus className="h-4 w-4 text-muted-foreground" />
      <span className="truncate font-medium">{collection.name}</span>
    </Button>
  );
}

function RenameDialog({
  open,
  onOpenChange,
  currentName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => void;
}) {
  const [value, setValue] = useState(currentName);
  useEffect(() => {
    setValue(currentName);
  }, [open, currentName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Collection</DialogTitle>
          <DialogDescription>
            Enter a new name for the collection.
          </DialogDescription>
        </DialogHeader>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded px-3 py-2 mt-4"
          placeholder="Collection name"
        />
        <DialogFooter className="mt-4 space-x-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={() => onConfirm(value.trim())}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Collection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this collection? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 space-x-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
