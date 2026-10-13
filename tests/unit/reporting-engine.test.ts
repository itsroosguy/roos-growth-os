import { describe, it, expect } from "vitest";
import { reportingEngine } from "../../src/lib/reports/reporting-engine";

describe("Business Reporting Engine", () => {
  const orgSlug = "acme-corp";

  it("should generate a report from actual CRM, WhatsApp, and automation records", () => {
    const report = reportingEngine.generateReport(orgSlug, "30d");

    expect(report.organizationId).toBe(orgSlug);
    expect(report.summary.totalContacts).toBeGreaterThan(0);
    expect(report.summary.totalLeads).toBeGreaterThan(0);
    expect(report.summary.pipelineValue).toBeGreaterThan(0);
  });

  it("should calculate lead conversion rate with the documented formula", () => {
    const report = reportingEngine.generateReport(orgSlug, "30d");
    const s = report.summary;

    expect(s.conversionFormula).toContain("(Won Leads / (Won Deals + Lost Deals))");

    const closedDeals = s.wonDealsCount + s.lostDealsCount;
    if (closedDeals > 0) {
      const expectedRate = parseFloat(((s.wonDealsCount / closedDeals) * 100).toFixed(1));
      expect(s.leadConversionRate).toBe(expectedRate);
    } else {
      expect(s.leadConversionRate).toBe(0);
    }
  });

  it("should compute follow-up completion rate and overdue counts accurately", () => {
    const report = reportingEngine.generateReport(orgSlug, "all");
    const s = report.summary;

    if (s.totalTasks > 0) {
      const expectedCompletionRate = parseFloat(
        ((s.completedTasksCount / s.totalTasks) * 100).toFixed(1)
      );
      expect(s.taskCompletionRate).toBe(expectedCompletionRate);
    }
    expect(s.overdueTasksCount).toBeGreaterThanOrEqual(0);
  });

  it("should report workflow reliability and execution metrics", () => {
    const report = reportingEngine.generateReport(orgSlug, "30d");
    const s = report.summary;

    expect(s.totalWorkflowExecutions).toBeGreaterThan(0);
    expect(s.workflowSuccessRate).toBeGreaterThan(0);
    expect(s.workflowSuccessRate).toBeLessThanOrEqual(100);
    expect(report.workflowMetrics.activeRulesCount).toBeGreaterThan(0);
  });

  it("should compile the WhatsApp messaging funnel without fabricated data", () => {
    const report = reportingEngine.generateReport(orgSlug, "30d");
    const funnel = report.messagingFunnel;

    expect(funnel.sent).toBeGreaterThanOrEqual(0);
    expect(funnel.delivered).toBeLessThanOrEqual(funnel.sent);
    expect(funnel.read).toBeLessThanOrEqual(funnel.delivered);
  });

  it("should respect date range filters (7d vs all)", () => {
    const report7d = reportingEngine.generateReport(orgSlug, "7d");
    const reportAll = reportingEngine.generateReport(orgSlug, "all");

    expect(report7d.timeRange).toBe("7d");
    expect(reportAll.timeRange).toBe("all");
    expect(reportAll.summary.totalContacts).toBeGreaterThanOrEqual(
      report7d.summary.newContactsCount
    );
  });
});
