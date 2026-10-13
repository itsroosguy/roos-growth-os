import { describe, it, expect, beforeEach } from "vitest";
import { templateStore } from "../../src/lib/campaigns/template-store";

describe("Milestone 6: WhatsApp Template Manager Unit Tests", () => {
  const orgSlug = "acme-corp";

  describe("1. Template Draft Validation", () => {
    it("should accept valid template name with lowercase letters, numbers, and underscores", () => {
      const result = templateStore.validateTemplateDraft({
        name: "spring_sale_promo_2026",
        category: "marketing",
        bodyContent: "Hello {{1}}, enjoy 20% off with code SPRING20. Reply STOP to opt out.",
      });
      expect(result.isValid).toBe(true);
      expect(result.variables).toEqual(["1"]);
      expect(result.errors.length).toBe(0);
    });

    it("should reject invalid template names containing uppercase letters or special characters", () => {
      const result1 = templateStore.validateTemplateDraft({
        name: "Spring-Sale-Promo!",
        category: "marketing",
        bodyContent: "Hello {{1}}, enjoy discounts. Reply STOP to opt out.",
      });
      expect(result1.isValid).toBe(false);
      expect(result1.errors[0]).toContain("lowercase letters, numbers, and underscores");

      const result2 = templateStore.validateTemplateDraft({
        name: "promo with spaces",
        category: "utility",
        bodyContent: "Your order is ready.",
      });
      expect(result2.isValid).toBe(false);
    });

    it("should reject non-sequential variable numbering", () => {
      const result = templateStore.validateTemplateDraft({
        name: "invalid_var_sequence",
        category: "utility",
        bodyContent: "Hello {{2}}, your order {{3}} has shipped.",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("sequentially numbered"))).toBe(true);
    });

    it("should extract multiple sequential variables correctly", () => {
      const result = templateStore.validateTemplateDraft({
        name: "multi_var_notification",
        category: "utility",
        bodyContent: "Hi {{1}}, your booking for {{2}} at {{3}} is confirmed.",
      });
      expect(result.isValid).toBe(true);
      expect(result.variables).toEqual(["1", "2", "3"]);
    });

    it("should flag marketing templates missing opt-out commands", () => {
      const result = templateStore.validateTemplateDraft({
        name: "marketing_no_optout",
        category: "marketing",
        bodyContent: "Hello {{1}}, check out our new deals today!",
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("opt-out instruction"))).toBe(true);
    });
  });

  describe("2. Approval Lifecycle & Mock Simulation", () => {
    it("should create new template drafts in PENDING status", () => {
      const createRes = templateStore.createTemplateDraft(orgSlug, {
        name: "summer_early_bird_blast",
        category: "marketing",
        body_content: "Hello {{1}}, get early access to summer tools. Reply STOP to unsubscribe.",
      });

      expect(createRes.success).toBe(true);
      expect(createRes.template).toBeDefined();
      expect(createRes.template?.status).toBe("PENDING");
    });

    it("should simulate Meta approval and set meta_template_id", () => {
      const templates = templateStore.getTemplates(orgSlug);
      const pendingTpl = templates.find((t) => t.status === "PENDING");
      expect(pendingTpl).toBeDefined();

      if (pendingTpl) {
        const approved = templateStore.simulateMetaApproval(orgSlug, pendingTpl.id);
        expect(approved).toBe(true);

        const updated = templateStore.getTemplateById(orgSlug, pendingTpl.id);
        expect(updated?.status).toBe("APPROVED");
        expect(updated?.meta_template_id).toBeTruthy();
      }
    });

    it("should simulate Meta rejection and store the rejection reason", () => {
      const createRes = templateStore.createTemplateDraft(orgSlug, {
        name: "rejected_test_template",
        category: "marketing",
        body_content: "Hello {{1}}, fast cash loans available now. Reply STOP to opt out.",
      });

      const tplId = createRes.template!.id;
      const rejected = templateStore.simulateMetaRejection(
        orgSlug,
        tplId,
        "Violation of WhatsApp Commerce Policy on Lending and Financial Services"
      );
      expect(rejected).toBe(true);

      const updated = templateStore.getTemplateById(orgSlug, tplId);
      expect(updated?.status).toBe("REJECTED");
      expect(updated?.rejection_reason).toContain("Violation of WhatsApp Commerce Policy");
    });
  });
});
