import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names cleanly with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees (INR) or specified currency with standard Indian grouping (e.g. ₹4,20,000)
 */
export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatINR = formatCurrency;

/**
 * Format date for display
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Deterministic avatar color assignment based on name
 * Palette: Ultramarine, Emerald, Amber, Sky, Violet, Rose, Flame
 */
export function getAvatarColor(name: string = ""): {
  bg: string;
  text: string;
  border: string;
} {
  const palette = [
    { bg: "bg-[#EAEEFF]", text: "text-[#2A3DB5]", border: "border-[#D3DCFF]" }, // Ultramarine
    { bg: "bg-[#E4F7EF]", text: "text-[#0A7A53]", border: "border-[#BDECD7]" }, // Emerald
    { bg: "bg-[#FFF3D6]", text: "text-[#8F5300]", border: "border-[#FFE5A3]" }, // Amber
    { bg: "bg-[#E3F3FD]", text: "text-[#0A6AA3]", border: "border-[#BFE3FA]" }, // Sky
    { bg: "bg-[#F0EAFF]", text: "text-[#5B34C9]", border: "border-[#D9C9FF]" }, // Violet
    { bg: "bg-[#FFE9EA]", text: "text-[#B42336]", border: "border-[#FFCCD0]" }, // Rose
    { bg: "bg-[#FFF1EA]", text: "text-[#B93A0A]", border: "border-[#FFE2D4]" }, // Flame
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Get 2-letter uppercase initials from name
 */
export function getInitials(name: string = ""): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "RS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Relative time formatting (e.g., "waiting 2h", "15m ago", "Just now")
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * 2027 Pipeline Stage Color Scale (Categorical meaning)
 */
export const STAGE_CONFIG = {
  inbound: { label: "Inbound", color: "#94A3B8", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  lead: { label: "Lead", color: "#94A3B8", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  contacted: { label: "Contacted", color: "#1FA2E8", bg: "#E3F3FD", text: "#0A6AA3", border: "#BFE3FA" },
  qualified: { label: "Qualified", color: "#3D5AFE", bg: "#EAEEFF", text: "#2A3DB5", border: "#D3DCFF" },
  proposal: { label: "Proposal", color: "#F5A524", bg: "#FFF3D6", text: "#8F5300", border: "#FFE5A3" },
  negotiation: { label: "Negotiation", color: "#7C4DFF", bg: "#F0EAFF", text: "#5B34C9", border: "#D9C9FF" },
  won: { label: "Won", color: "#12B886", bg: "#E4F7EF", text: "#0A7A53", border: "#BDECD7" },
  lost: { label: "Lost", color: "#E5484D", bg: "#FFE9EA", text: "#B42336", border: "#FFCCD0" },
} as const;
