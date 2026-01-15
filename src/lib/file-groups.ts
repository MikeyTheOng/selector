import type { ExplorerItem } from "@/types/explorer";
import { getFileKind } from "./file-types";

export { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "./file-types";

export type MediaType = "image" | "video" | "other";

export interface FileGroup {
  type: MediaType;
  files: ExplorerItem[];
  extensions: Set<string>;
}

export interface GroupedFiles {
  images: FileGroup;
  videos: FileGroup;
  others: FileGroup;
  hasImages: boolean;
  hasVideos: boolean;
  hasOthers: boolean;
  hasMultipleTypes: boolean;
}

export function getMediaType(extension: string | undefined): MediaType {
  const kind = getFileKind(extension);
  return kind === "document" ? "other" : kind;
}

export function getFirstExtension(files: ExplorerItem[]): string | undefined {
  for (const file of files) {
    if (file.kind === "file" && file.extension) {
      return file.extension;
    }
  }
  return undefined;
}

export function groupFilesByMediaType(files: ExplorerItem[]): GroupedFiles {
  const images: ExplorerItem[] = [];
  const videos: ExplorerItem[] = [];
  const others: ExplorerItem[] = [];

  const imageExtensions = new Set<string>();
  const videoExtensions = new Set<string>();
  const otherExtensions = new Set<string>();

  for (const file of files) {
    const extension = file.kind === "file" ? file.extension : undefined;
    const mediaType = getMediaType(extension);

    switch (mediaType) {
      case "image":
        images.push(file);
        if (extension) imageExtensions.add(extension);
        break;
      case "video":
        videos.push(file);
        if (extension) videoExtensions.add(extension);
        break;
      case "other":
        others.push(file);
        if (extension) otherExtensions.add(extension);
        break;
    }
  }

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  const hasOthers = others.length > 0;

  const typeCount = [hasImages, hasVideos, hasOthers].filter(Boolean).length;
  const hasMultipleTypes = typeCount > 1;

  return {
    images: {
      type: "image",
      files: images,
      extensions: imageExtensions,
    },
    videos: {
      type: "video",
      files: videos,
      extensions: videoExtensions,
    },
    others: {
      type: "other",
      files: others,
      extensions: otherExtensions,
    },
    hasImages,
    hasVideos,
    hasOthers,
    hasMultipleTypes,
  };
}

export function getFileCountLabel(count: number, mediaType: MediaType): string {
  if (count === 0) return "";
  if (count === 1) {
    switch (mediaType) {
      case "image":
        return "1 photo";
      case "video":
        return "1 video";
      default:
        return "1 file";
    }
  }

  switch (mediaType) {
    case "image":
      return `${count} photos`;
    case "video":
      return `${count} videos`;
    default:
      return `${count} files`;
  }
}
