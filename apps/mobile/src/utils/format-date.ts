const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parseDate(dateInput: string | Date | number): Date | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

export function formatMemberSince(dateInput: string | Date | number): string {
  const d = parseDate(dateInput);
  if (!d) return "Member";
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `Member since ${day} ${month} ${year}`;
}

export function formatFullDateTime(dateInput: string | Date | number): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  const day = d.getDate();
  const month = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatUtcDateTime(dateInput: string | Date | number): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export function formatRelativeTime(
  dateInput: string | Date | number,
  now = Date.now()
): string {
  const d = parseDate(dateInput);
  if (!d) return "";

  const diffSec = Math.floor((now - d.getTime()) / 1000);
  if (diffSec < 30) return "Just now";
  if (diffSec < 60) return "< 1m ago";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const day = d.getDate();
  const month = SHORT_MONTHS[d.getMonth()];
  return `${day} ${month}`;
}
