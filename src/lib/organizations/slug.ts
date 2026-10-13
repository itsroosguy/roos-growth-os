/**
 * Sanitizes and formats an organization name into a clean, URL-safe slug.
 * E.g. "Acme Corp, Ltd." -> "acme-corp-ltd"
 */
export function cleanSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters
    .replace(/[\s_-]+/g, "-")  // Replace whitespace and underscores with a single hyphen
    .replace(/^-+|-+$/g, "");  // Remove leading and trailing hyphens
}

/**
 * Validates whether a slug conforms to URL safety rules.
 * Must be 2-48 lowercase alphanumeric characters and hyphens, not starting or ending with a hyphen.
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slug.length >= 2 && slug.length <= 48 && slugRegex.test(slug);
}
