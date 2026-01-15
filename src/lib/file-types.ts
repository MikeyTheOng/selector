export type FileKind = "image" | "video" | "document";

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".webp",
  ".heic",
  ".heif",
  ".raw",
  ".cr2",
  ".nef",
  ".arw",
  ".dng",
  ".orf",
  ".rw2",
  ".pef",
  ".srw",
] as const;

const VIDEO_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".wmv",
  ".flv",
  ".webm",
  ".m4v",
  ".mpg",
  ".mpeg",
  ".3gp",
  ".mts",
  ".m2ts",
  ".vob",
] as const;

const kindLabels: Record<string, string> = {
  pdf: "PDF document",
  json: "JSON",
  zip: "ZIP archive",
  jpg: "JPEG image",
  jpeg: "JPEG image",
  png: "PNG image",
  gif: "GIF image",
  heic: "HEIC image",
  heif: "HEIF image",
  tif: "TIFF image",
  tiff: "TIFF image",
  bmp: "BMP image",
  webp: "WEBP image",
  mp3: "MP3 audio",
  wav: "WAV audio",
  flac: "FLAC audio",
  m4a: "M4A audio",
  mp4: "MPEG-4 movie",
  mov: "QuickTime movie",
  avi: "AVI movie",
  mkv: "MKV movie",
  txt: "Text document",
  csv: "CSV document",
  md: "Markdown document",
  html: "HTML document",
  js: "JavaScript file",
  ts: "TypeScript file",
  tsx: "TypeScript React file",
  jsx: "JavaScript React file",
};

const normalizeExtension = (extension?: string | null) => {
  if (!extension) return "";
  const normalized = extension.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.startsWith(".") ? normalized.slice(1) : normalized;
};

const normalizeWithDot = (extension: string) => `.${extension}`;

export const getFileKind = (extension?: string | null): FileKind => {
  const normalized = normalizeExtension(extension);
  if (!normalized) return "document";

  const withDot = normalizeWithDot(normalized);
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(withDot)) {
    return "image";
  }
  if ((VIDEO_EXTENSIONS as readonly string[]).includes(withDot)) {
    return "video";
  }
  return "document";
};

export const getKindLabel = (extension: string) => {
  const normalized = normalizeExtension(extension);
  if (!normalized) {
    return "File";
  }
  return kindLabels[normalized] ?? normalized.toUpperCase();
};
