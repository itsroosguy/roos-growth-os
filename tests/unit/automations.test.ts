import { describe, it, expect, beforeEach } from "vitest";
import { automationEngine } from "../../src/lib/automations/automation-engine";
import { PREDEFINED_TEMPLATES } from "../../src/lib/automations/templates";

describe("Workflow Automation Engine & Predefined Templates", () => {
  const orgSlug = "acme-corp";

  it("should provide exactly 6 predefined templates (Templates A through F)", () => {
    expect(PREDEFINED_TEMPLATES).toHaveLength(6);
    const templateIds = PREDEFINED_TEMPLATES.map((t) => t.id);
    expect(templateIds).toEqual([
      "template_a",
      "template_b",
      "template_c",
      "template_d",
      "template_e",
      "template_f",
    ]);
  });

  it("should evaluate workflow condition operators correctly", () => {
    // 1. equals operator
    expect(
      automationEngine.evaluateConditions(
        [{ id: "1", field: "stage", operator: "equals", value: "qualified" }],
        { stage: "qualified" }
      )
    ).toBe(true);

    expect(
      automationEngine.evaluateConditions(
        [{ id: "1", field: "stage", operator: "equals", value: "qualified" }],
        { stage: "new" }
      )
    ).toBe(false);

    // 2. in operator
    expect(
      automationEngine.evaluateConditions(
        [{ id: "2", field: "stage", operator: "in", value: ["qualified", "proposal"] }],
        { stage: "proposal" }
      )
    ).toBe(true);

    // 3. greater_than operator
    expect(
      automationEngine.evaluateConditions(
        [{ id: "3", field: "deal_value", operator: "greater_than", value: 10000 }],
        { deal_value: 25000 }
      )
    ).toBe(true);

    // 4. contains operator
    expect(
      automationEngine.evaluateConditions(
        [{ id: "4", field: "tags", operator: "contains", value: "VIP" }],
        { tags: "VIP, Retail, Priority" }
      )
    ).toBe(true);
  });

  it("should activate a predefined template and persist it into org rules", () => {
    const res = automationEngine.activatePredefinedTemplate(orgSlug, "template_e");
    expect(res.success).toBe(true);
    expect(res.rule).toBeDefined();
    expect(res.rule?.name).toContain("Conversation Resolved");

    const rules = automationEngine.getRules(orgSlug);
    const found = rules.find((r) => r.template_id === "template_e");
    expect(found).toBeDefined();
    expect(found?.is_active).toBe(true);
  });

  it("should enforce loop recursion guards at execution depth greater than 3", async () => {
    const results = await automationEngine.triggerAutomations({
      organization_id: orgSlug,
      trigger_type: "lead.created",
      entity_id: "lead-loop-test",
      execution_depth: 4, // Exceeds max recursion depth
      data: { lead: { id: "lead-loop-test" } },
    });

    expect(results).toHaveLength(0); // Guard halts trigger to prevent infinite cascade
  });
});
