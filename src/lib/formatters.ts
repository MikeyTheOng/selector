const formatSize = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"] as const;
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const formatDateTime = (value?: Date | null) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "-";
  }

  const now = new Date();

  // Day boundaries (local time)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  // "1:20pm" (no space, lowercase am/pm)
  const parts = timeFormatter.formatToParts(value);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value ?? "").toLowerCase();
  const timeStr = `${hour}:${minute}${dayPeriod}`;

  if (value >= startOfToday && value < startOfTomorrow) {
    return `Today at ${timeStr}`;
  }

  if (value >= startOfYesterday && value < startOfToday) {
    return `Yesterday at ${timeStr}`;
  }

  return `${dateFormatter.format(value)} at ${timeStr}`;
};

const getExtension = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === name.length - 1) {
    return "";
  }
  return name.slice(lastDot + 1).toLowerCase();
};

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

const getKindLabel = (extension: string) => {
  if (!extension) {
    return "File";
  }
  return kindLabels[extension] ?? extension.toUpperCase();
};

export { formatSize, formatDateTime, getExtension, getKindLabel };
