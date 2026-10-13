"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Task, TaskPriority, TaskStatus } from "@/types/crm";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  Search,
  Check,
} from "lucide-react";
import { useMounted } from "@/lib/use-mounted";

type FilterTab = "today" | "overdue" | "upcoming" | "completed" | "all";

export default function TasksPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("today");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Task Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [assignedTo, setAssignedTo] = useState("Workspace Founder");

  // Fetch data
  const rawTasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  const leads = useMemo(() => {
    return crmStore.getLeads(orgSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug, refreshKey]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return rawTasks.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
        (t.lead_title && t.lead_title.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      const taskDate = new Date(t.due_date);
      const isCompleted = t.status === "completed";

      switch (activeTab) {
        case "today":
          return !isCompleted && t.due_date.startsWith(todayStr);
        case "overdue":
          return !isCompleted && taskDate < startOfToday;
        case "upcoming":
          return !isCompleted && taskDate > new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        case "completed":
          return isCompleted;
        case "all":
        default:
          return true;
      }
    });
  }, [rawTasks, activeTab, searchQuery]);

  // Handlers
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    const lead = leads.find((l) => l.id === selectedLeadId);

    crmStore.createTask(orgSlug, {
      title: taskTitle,
      description: taskDesc || undefined,
      due_date: new Date(taskDueDate).toISOString(),
      priority: taskPriority,
      status: "todo",
      lead_id: lead ? lead.id : undefined,
      lead_title: lead ? lead.title : undefined,
      contact_id: lead ? lead.contact_id : undefined,
      contact_name: lead ? lead.contact_name : undefined,
      assigned_to_name: assignedTo,
    });

    setTaskTitle("");
    setTaskDesc("");
    setSelectedLeadId("");
    setCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleTask = (task: Task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    crmStore.updateTaskStatus(orgSlug, task.id, nextStatus);
    setRefreshKey((k) => k + 1);
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case "high":
        return <Badge variant="danger" className="text-xs uppercase font-extrabold px-2.5 py-0.5">High</Badge>;
      case "medium":
        return <Badge variant="warning" className="text-xs uppercase font-extrabold px-2.5 py-0.5">Medium</Badge>;
      case "low":
        return <Badge variant="neutral" className="text-xs uppercase font-extrabold px-2.5 py-0.5">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Tasks & Follow-ups
            </h1>
            <span
              className="glass-pill rounded-full bg-white/90 border border-slate-200/80 text-xs sm:text-sm font-semibold px-3.5 py-1 text-slate-800 shadow-xs flex items-center gap-1.5"
              suppressHydrationWarning
            >
              <span className="font-mono font-black text-slate-950">
                {mounted ? rawTasks.filter((t) => t.status !== "completed").length : rawTasks.filter((t) => t.status !== "completed").length}
              </span>
              <span>active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Scheduled customer reminders and team assignments for {currentOrg.name}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs text-xs sm:text-sm h-10 px-4"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Schedule Follow-up
        </Button>
      </div>

      {/* Tabs and Search */}
      <div className="glass-panel p-4 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-glass">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 border border-white/80 rounded-xl p-1 bg-white/60 backdrop-blur-xs shadow-2xs">
            {(
              [
                { id: "today", label: "Due Today" },
                { id: "overdue", label: "Overdue" },
                { id: "upcoming", label: "Upcoming" },
                { id: "completed", label: "Completed" },
                { id: "all", label: "All Tasks" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 font-extrabold shadow-xs border border-white"
                    : "text-slate-600 hover:text-slate-900 font-semibold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/80 bg-white/70 pl-10 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 backdrop-blur-sm focus:border-blue-500/80 focus:bg-white focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8 text-google-blue" />}
          title={`No ${activeTab} follow-ups`}
          description="You are all caught up! Schedule a new follow-up reminder for any sales lead or customer."
          actionLabel="Schedule Follow-up"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Done</TableHead>
              <TableHead className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Task / Follow-up</TableHead>
              <TableHead className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Associated Deal & Customer</TableHead>
              <TableHead className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Due Date</TableHead>
              <TableHead className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Priority</TableHead>
              <TableHead className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 py-3.5">Assigned To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => {
              const taskDue = new Date(task.due_date);
              const nowDate = new Date();
              const isOverdue =
                task.status !== "completed" && taskDue < new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
              const isToday =
                task.status !== "completed" && task.due_date.startsWith(nowDate.toISOString().split("T")[0]);

              return (
                <TableRow
                  key={task.id}
                  className={task.status === "completed" ? "opacity-60 bg-surface-subtle/50" : ""}
                >
                  <TableCell>
                    <button
                      onClick={() => handleToggleTask(task)}
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors cursor-pointer ${
                        task.status === "completed"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "border-slate-300 hover:border-blue-600 bg-white"
                      }`}
                      aria-label="Toggle completed"
                    >
                      {task.status === "completed" && <Check className="h-4 w-4 stroke-[3]" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col py-1">
                      <span
                        className={`text-sm sm:text-base font-bold ${
                          task.status === "completed" ? "line-through text-slate-400" : "text-slate-950"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-xs sm:text-sm text-slate-600 font-medium line-clamp-1">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {task.lead_title || "General Follow-up"}
                      </span>
                      {task.contact_name && (
                        <span className="text-xs text-slate-600 font-medium">
                          {task.contact_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-mono">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <span
                        className={
                          isOverdue
                            ? "text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg font-black"
                            : isToday
                            ? "text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-black"
                            : "text-slate-900 font-bold"
                        }
                      >
                        {formatDate(task.due_date)}
                        {isOverdue && " (Overdue)"}
                        {isToday && " (Today)"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell className="text-xs sm:text-sm font-semibold text-slate-800">
                    {task.assigned_to_name || "Unassigned"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Schedule Follow-up Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateTask}>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up Task</DialogTitle>
            <DialogDescription>
              Create a reminder with due date and priority for your sales team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4">
            <Input
              label="Task Title *"
              placeholder="e.g. Call client for proposal decision"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground-secondary">
                Associate with Lead / Deal
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs text-foreground focus:border-google-blue focus:outline-none"
              >
                <option value="">-- No specific lead (General task) --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.contact_name}) - ₹{l.estimated_value.toLocaleString("en-IN")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Due Date *"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground-secondary">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-border bg-white px-3.5 py-2 text-xs text-foreground focus:border-google-blue focus:outline-none h-11"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <Input
              label="Task Description"
              placeholder="Instructions or agenda for this follow-up..."
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Follow-up</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
