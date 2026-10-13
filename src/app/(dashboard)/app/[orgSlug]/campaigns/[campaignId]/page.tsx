"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { campaignStore } from "@/lib/campaigns/campaign-store";
import { CampaignStatus, RecipientDeliveryStatus } from "@/lib/campaigns/types";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
  ArrowLeft,
  Download,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface CampaignDetailPageProps {
  params: {
    orgSlug: string;
    campaignId: string;
  };
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; badgeVariant: "default" | "success" | "warning" | "danger" | "neutral" }
> = {
  draft: { label: "Draft", badgeVariant: "neutral" },
  scheduled: { label: "Scheduled", badgeVariant: "warning" },
  processing: { label: "Sending", badgeVariant: "default" },
  paused: { label: "Paused", badgeVariant: "warning" },
  completed: { label: "Completed", badgeVariant: "success" },
  cancelled: { label: "Cancelled", badgeVariant: "neutral" },
  failed: { label: "Failed", badgeVariant: "danger" },
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { orgSlug, campaignId } = params;
  const { currentOrg } = useTenant();

  const [refreshKey, setRefreshKey] = useState(0);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<string>("all");

  const campaign = useMemo(() => {
    return campaignStore.getCampaignById(orgSlug, campaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, campaignId, refreshKey]);

  const allRecipients = useMemo(() => {
    return campaignStore.getCampaignRecipients(campaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, refreshKey]);

  const filteredRecipients = useMemo(() => {
    let list = allRecipients;
    if (recipientStatusFilter !== "all") {
      list = list.filter((r) => r.status === recipientStatusFilter);
    }
    if (recipientSearch.trim()) {
      const q = recipientSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.contact_name.toLowerCase().includes(q) ||
          r.phone.includes(q)
      );
    }
    return list;
  }, [allRecipients, recipientStatusFilter, recipientSearch]);

  const handlePause = () => {
    campaignStore.pauseCampaign(orgSlug, campaignId);
    setRefreshKey((k) => k + 1);
  };

  const handleResume = () => {
    campaignStore.resumeCampaign(orgSlug, campaignId);
    setRefreshKey((k) => k + 1);
  };

  const handleCancel = () => {
    if (confirm("Cancel remaining queued sends for this campaign?")) {
      campaignStore.cancelCampaign(orgSlug, campaignId);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportCSV = () => {
    const csvContent = campaignStore.exportCampaignReportCSV(campaignId);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `campaign_${campaignId}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!campaign) {
    return (
      <div className="p-8 text-center text-xs text-foreground-secondary">
        <p className="font-semibold text-foreground text-sm">Campaign Not Found</p>
        <Link href={`/app/${orgSlug}/campaigns`} className="text-google-blue underline mt-2 block">
          Return to Campaigns
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const sentPercent = campaign.total_recipients > 0 ? Math.round((campaign.sent_count / campaign.total_recipients) * 100) : 0;
  const deliveredPercent = campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0;
  const readPercent = campaign.sent_count > 0 ? Math.round((campaign.read_count / campaign.sent_count) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/app/${orgSlug}/campaigns`}
          className="text-xs text-foreground-secondary hover:text-google-blue flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
        </Link>

        {/* Campaign Actions */}
        <div className="flex items-center gap-2">
          {campaign.status === "processing" && (
            <Button size="sm" variant="secondary" onClick={handlePause} className="text-xs">
              <PauseCircle className="h-3.5 w-3.5 mr-1 text-google-yellow-hover" /> Pause
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" variant="secondary" onClick={handleResume} className="text-xs">
              <PlayCircle className="h-3.5 w-3.5 mr-1 text-google-green" /> Resume
            </Button>
          )}
          {(campaign.status === "scheduled" || campaign.status === "paused") && (
            <Button size="sm" variant="dangerGhost" onClick={handleCancel} className="text-xs">
              <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export Report (CSV)
          </Button>
        </div>
      </div>

      {/* Campaign Details Header */}
      <div className="p-6 rounded-3xl bg-white border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
              <Badge variant={statusCfg.badgeVariant} className="text-xs uppercase font-bold">
                {statusCfg.label}
              </Badge>
              {campaign.is_test_mode && (
                <Badge variant="neutral" className="text-[10px] font-mono">
                  TEST RUN
                </Badge>
              )}
            </div>
            <p className="text-xs text-foreground-secondary mt-1">
              Template: <code className="font-mono bg-surface-subtle px-1.5 py-0.5 rounded text-foreground">{campaign.template_name}</code> ({campaign.template_category.toUpperCase()}) • Launched by {campaign.created_by_name} on {formatDate(campaign.created_at)}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-foreground-secondary block">Actual Meta Cloud Spend</span>
            <span className="text-2xl font-bold text-google-blue">
              ₹{campaign.actual_cost > 0 ? campaign.actual_cost.toFixed(2) : campaign.estimated_cost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-border">
          <div className="p-3 rounded-2xl bg-surface-subtle text-center">
            <span className="text-[11px] text-foreground-secondary block">Target Audience</span>
            <span className="text-xl font-bold text-foreground">{campaign.total_recipients}</span>
          </div>
          <div className="p-3 rounded-2xl bg-surface-subtle text-center">
            <span className="text-[11px] text-foreground-secondary block">Messages Sent</span>
            <span className="text-xl font-bold text-google-blue">{campaign.sent_count}</span>
          </div>
          <div className="p-3 rounded-2xl bg-surface-subtle text-center">
            <span className="text-[11px] text-foreground-secondary block">Delivered ({deliveredPercent}%)</span>
            <span className="text-xl font-bold text-google-green">{campaign.delivered_count}</span>
          </div>
          <div className="p-3 rounded-2xl bg-surface-subtle text-center">
            <span className="text-[11px] text-foreground-secondary block">Read ({readPercent}%)</span>
            <span className="text-xl font-bold text-google-blue">{campaign.read_count}</span>
          </div>
          <div className="p-3 rounded-2xl bg-surface-subtle text-center">
            <span className="text-[11px] text-foreground-secondary block">Failed</span>
            <span className="text-xl font-bold text-google-red">{campaign.failed_count}</span>
          </div>
        </div>

        {/* Delivery Funnel Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-foreground-secondary font-medium">
            <span>Progress: {campaign.sent_count} / {campaign.total_recipients} Dispatched</span>
            <span>{sentPercent}% Completed</span>
          </div>
          <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-border">
            <div className="h-full bg-google-green transition-all" style={{ width: `${sentPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Recipient Delivery Log Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Recipient Delivery Log ({allRecipients.length})
            </h2>
            <p className="text-xs text-foreground-secondary">
              Real-time delivery receipts from Meta WhatsApp Business Platform webhooks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-foreground-secondary" />
              <Input
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Search recipient..."
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>

            <select
              value={recipientStatusFilter}
              onChange={(e) => setRecipientStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-white px-2.5 py-1 text-xs text-foreground focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="read">Read</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="skipped">Skipped / Opted-out</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="rounded-3xl border border-border bg-white overflow-hidden shadow-subtle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Message ID (wamid)</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Timestamps</TableHead>
                <TableHead className="text-right">Notes / Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-foreground-secondary">
                    No recipients match the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-semibold text-xs text-foreground block">
                        {r.contact_name}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs text-foreground">
                        {r.phone}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {r.status === "read" && (
                          <span className="flex items-center gap-1 text-xs text-google-blue font-semibold">
                            <CheckCheck className="h-3.5 w-3.5" /> Read
                          </span>
                        )}
                        {r.status === "delivered" && (
                          <span className="flex items-center gap-1 text-xs text-google-green font-medium">
                            <CheckCheck className="h-3.5 w-3.5" /> Delivered
                          </span>
                        )}
                        {r.status === "sent" && (
                          <span className="flex items-center gap-1 text-xs text-foreground-secondary font-medium">
                            <Check className="h-3.5 w-3.5" /> Sent
                          </span>
                        )}
                        {r.status === "queued" && (
                          <span className="flex items-center gap-1 text-xs text-google-yellow-hover font-medium">
                            <Clock className="h-3.5 w-3.5" /> Queued
                          </span>
                        )}
                        {r.status === "skipped" && (
                          <span className="flex items-center gap-1 text-xs text-google-yellow-hover font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> Opted-Out
                          </span>
                        )}
                        {r.status === "failed" && (
                          <span className="flex items-center gap-1 text-xs text-google-red font-medium">
                            <XCircle className="h-3.5 w-3.5" /> Failed
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-[11px] text-foreground-secondary">
                        {r.external_message_id || "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-semibold text-foreground">
                        ₹{r.cost.toFixed(2)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="text-[10px] text-foreground-secondary space-y-0.5">
                        {r.sent_at && <div>Sent: {formatDate(r.sent_at)}</div>}
                        {r.read_at && <div className="text-google-blue">Read: {formatDate(r.read_at)}</div>}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {r.error_message ? (
                        <span className="text-[11px] text-google-red">
                          {r.error_message}
                        </span>
                      ) : (
                        <span className="text-[11px] text-google-green">
                          Successfully delivered
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
