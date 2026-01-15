import { getKindLabel } from "./file-types";

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

export { formatSize, formatDateTime, getExtension, getKindLabel };
