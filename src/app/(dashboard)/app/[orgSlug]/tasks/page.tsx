"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Task, TaskPriority, TaskStatus } from "@/types/crm";
import { formatDate } from "@/lib/utils";
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
  AlertTriangle,
} from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { useToast } from "@/components/ui/toast-context";

type FilterTab = "today" | "overdue" | "upcoming" | "completed" | "all";

export default function TasksPage() {
  const { currentOrg, userRole, isJuniorManager } = useTenant();
  const orgSlug = currentOrg.slug;
  const mounted = useMounted();
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");

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

  // Counts for KPI banner
  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return rawTasks.filter((t) => t.status !== "completed" && t.due_date.startsWith(todayStr)).length;
  }, [rawTasks]);

  const overdueCount = useMemo(() => {
    const n = new Date();
    const startOfToday = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return rawTasks.filter((t) => t.status !== "completed" && new Date(t.due_date) < startOfToday).length;
  }, [rawTasks]);

  const upcomingCount = useMemo(() => {
    const n = new Date();
    const endOfTomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    return rawTasks.filter((t) => t.status !== "completed" && new Date(t.due_date) > endOfTomorrow).length;
  }, [rawTasks]);

  const completedCount = useMemo(() => {
    return rawTasks.filter((t) => t.status === "completed").length;
  }, [rawTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const n = new Date();
    const todayStr = n.toISOString().split("T")[0];
    const startOfToday = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const endOfTomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);

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
          return !isCompleted && taskDate > endOfTomorrow;
        case "completed":
          return isCompleted;
        case "all":
        default:
          return true;
      }
    });
  }, [rawTasks, activeTab, searchQuery]);

  // Handlers
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      title: quickTitle.trim(),
      due_date: new Date().toISOString(),
      priority: "medium",
      status: "todo",
      assigned_to_name: "Workspace Founder",
    });

    setQuickTitle("");
    setRefreshKey((k) => k + 1);
    toast("Task Created! 🎯", {
      message: `Due today • Medium Priority`,
      type: "success",
    });
  };

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
    toast("Follow-up Scheduled! 📅", {
      message: `${taskTitle} added to calendar`,
      type: "success",
    });
  };

  const handleToggleTask = (task: Task) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    crmStore.updateTaskStatus(orgSlug, task.id, nextStatus);
    setRefreshKey((k) => k + 1);
    if (nextStatus === "completed") {
      toast("Task Completed! 🎉", {
        message: task.title,
        type: "success",
      });
    } else {
      toast("Task Re-opened", {
        message: task.title,
        type: "info",
      });
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case "high":
        return <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">High</span>;
      case "medium":
        return <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Medium</span>;
      case "low":
        return <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-[#F7F7F8] text-[#8E8E93] border border-[#E5E5E7]">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D0D0E]">
              Tasks &amp; Follow-ups
            </h1>
            <span
              className="rounded-full bg-[#FFF4EC] border border-[#FF7900]/30 text-xs font-bold px-3 py-1 text-[#FF7900] flex items-center gap-1.5 shadow-2xs font-mono"
              suppressHydrationWarning
            >
              <span className="font-mono font-black text-[#FF7900]">
                {mounted ? rawTasks.filter((t) => t.status !== "completed").length : rawTasks.filter((t) => t.status !== "completed").length}
              </span>
              <span>active</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E8E93] font-medium mt-1">
            Scheduled customer reminders and team assignments for {currentOrg.name}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold shadow-2xs text-xs h-9 px-3.5 cursor-pointer"
        >
          <Plus className="mr-1.5 h-4 w-4 stroke-[3]" />
          Schedule Follow-up
        </Button>
      </div>

      {isJuniorManager && (
        <div className="bg-[#121214] text-white rounded-2xl border border-[#1F1F23] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#FF7900] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              L3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  Junior Manager Task &amp; Execution Workspace
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#24180E] text-[#FF7900] border border-[#FF7900]/40">
                  Clearance Level 3
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] font-normal mt-0.5">
                Your credential is tuned for rapid task completion, client follow-up reminders, and response SLAs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-2xs">
              Daily Target: Zero Overdue
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Due Today</span>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">{todayCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Overdue</span>
            <div className="text-2xl font-black font-mono text-rose-600 mt-1">{overdueCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7900]">Upcoming</span>
            <div className="text-2xl font-black font-mono text-[#FF7900] mt-1">{upcomingCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FFF4EC] border border-[#FF7900]/30 flex items-center justify-center text-[#FF7900]">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E7] p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">{completedCount}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5E7] shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1 border border-[#E5E5E7] rounded-xl p-1 bg-[#F7F7F8] shadow-2xs">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#0D0D0E] text-white shadow-2xs"
                    : "text-[#8E8E93] hover:text-[#0D0D0E] font-semibold"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] pl-10 pr-3 text-xs sm:text-sm font-medium text-[#0D0D0E] placeholder:text-[#8E8E93] focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:bg-white focus:outline-none transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Quick In-Place Task Creation Bar */}
      <form
        onSubmit={handleQuickAddTask}
        className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-[#E5E5E7] shadow-xs"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#FFF4EC] text-[#FF7900] shrink-0 ml-1">
          <Plus className="h-4 w-4 stroke-[3]" />
        </div>
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Quick add a task or reminder for today (e.g. Call Rajesh for contract signing)..."
          className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm font-medium text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!quickTitle.trim()}
          className="h-8 px-3.5 rounded-xl bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold text-xs shadow-2xs cursor-pointer active:scale-95 transition-all"
        >
          Add Task
        </Button>
      </form>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8 text-[#FF7900]" />}
          title={`No ${activeTab} follow-ups`}
          description="You are all caught up! Schedule a new follow-up reminder for any sales lead or customer."
          actionLabel="Schedule Follow-up"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5E7] shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F7F7F8] border-b border-[#E5E5E7]">
              <TableRow>
                <TableHead className="w-14 text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Done</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Task / Follow-up</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Associated Deal &amp; Customer</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Due Date</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Priority</TableHead>
                <TableHead className="text-xs font-black uppercase tracking-wider text-[#8E8E93] py-3.5">Assigned To</TableHead>
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
                    className={`hover:bg-[#FFF4EC]/15 transition-colors ${task.status === "completed" ? "opacity-60 bg-slate-50/50" : ""}`}
                  >
                    <TableCell>
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
                          task.status === "completed"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                            : "border-[#8E8E93] hover:border-[#FF7900] bg-white"
                        }`}
                        aria-label="Toggle completed"
                      >
                        {task.status === "completed" && <Check className="h-4 w-4 stroke-[3]" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col py-1">
                        <span
                          className={`text-sm font-bold ${
                            task.status === "completed" ? "line-through text-[#8E8E93]" : "text-[#0D0D0E]"
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-xs text-[#8E8E93] font-normal line-clamp-1">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0D0D0E]">
                          {task.lead_title || "General Follow-up"}
                        </span>
                        {task.contact_name && (
                          <span className="text-[11px] text-[#8E8E93] font-normal">
                            {task.contact_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1.5 text-xs font-mono">
                        <Calendar className="h-3.5 w-3.5 text-[#8E8E93] shrink-0" />
                        <span
                          className={
                            isOverdue
                              ? "text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-black"
                              : isToday
                              ? "text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-black"
                              : "text-[#0D0D0E] font-bold"
                          }
                        >
                          {formatDate(task.due_date)}
                          {isOverdue && " (Overdue)"}
                          {isToday && " (Today)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell className="text-xs font-semibold text-[#0D0D0E]">
                      {task.assigned_to_name || "Unassigned"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateTask} className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0D0D0E]">Schedule Follow-up Task</DialogTitle>
            <DialogDescription className="text-xs text-[#8E8E93]">
              Create a reminder with due date and priority for your sales team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-4 text-xs">
            <Input
              label="Task Title *"
              placeholder="e.g. Call client for proposal decision"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0D0D0E]">
                Associate with Lead / Deal
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 py-2 text-xs font-medium text-[#0D0D0E] focus:border-[#FF7900] focus:bg-white focus:outline-none"
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
                className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs font-mono"
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#0D0D0E]">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-[#E5E5E7] bg-[#F7F7F8] px-3.5 py-2 text-xs font-medium text-[#0D0D0E] focus:border-[#FF7900] focus:bg-white focus:outline-none h-10"
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
              className="bg-[#F7F7F8] border-[#E5E5E7] focus:bg-white text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)} className="text-[#8E8E93]">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#FF7900] hover:bg-[#E66D00] text-white font-bold">Save Follow-up</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
