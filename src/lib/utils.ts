import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names cleanly with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees (INR) or specified currency
 */
export function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
