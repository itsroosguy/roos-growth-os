import { describe, it, expect } from "vitest";
import { cleanSlug, isValidSlug } from "../../src/lib/organizations/slug";

describe("Organization Slug Utilities", () => {
  it("should convert names to URL-safe slugs", () => {
    expect(cleanSlug("Acme Technologies")).toBe("acme-technologies");
    expect(cleanSlug("Beta & Gamma, Inc.")).toBe("beta-gamma-inc");
    expect(cleanSlug("  Trim Spaces  ")).toBe("trim-spaces");
    expect(cleanSlug("Special $#@ Characters")).toBe("special-characters");
    expect(cleanSlug("Multi---Hyphens")).toBe("multi-hyphens");
  });

  it("should validate slugs correctly", () => {
    expect(isValidSlug("acme")).toBe(true);
    expect(isValidSlug("acme-technologies")).toBe(true);
    expect(isValidSlug("beta-123")).toBe(true);

    // Invalid slugs
    expect(isValidSlug("a")).toBe(false); // Too short
    expect(isValidSlug("-starts-with-hyphen")).toBe(false);
    expect(isValidSlug("ends-with-hyphen-")).toBe(false);
    expect(isValidSlug("Contains Capitals")).toBe(false);
    expect(isValidSlug("has spaces")).toBe(false);
  });
});
