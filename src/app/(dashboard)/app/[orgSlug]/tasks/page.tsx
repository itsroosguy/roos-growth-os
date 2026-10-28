"use client";

import React, { useState, useMemo } from "react";
import { useTenant } from "@/lib/organizations/tenant-context";
import { crmStore } from "@/lib/crm/crm-store";
import { Task, TaskPriority, TaskStatus } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { Drawer } from "@/components/ui/drawer";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-context";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Check,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export default function TasksPage() {
  const { currentOrg } = useTenant();
  const orgSlug = currentOrg.slug;
  const { toast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [contactName, setContactName] = useState("");

  // Live tasks
  const rawTasks = useMemo(() => {
    return crmStore.getTasks(orgSlug);
  }, [orgSlug, refreshKey]);

  // Date boundaries
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Filtered tasks
  const tasks = useMemo(() => {
    if (!searchQuery.trim()) return rawTasks;
    const q = searchQuery.toLowerCase();
    return rawTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q))
    );
  }, [rawTasks, searchQuery]);

  // Grouped Tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed" && new Date(t.due_date) < startOfToday);
  }, [tasks, startOfToday]);

  const todayTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        new Date(t.due_date) >= startOfToday &&
        new Date(t.due_date) <= endOfToday
    );
  }, [tasks, startOfToday, endOfToday]);

  const upcomingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed" && new Date(t.due_date) > endOfToday);
  }, [tasks, endOfToday]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "completed");
  }, [tasks]);

  // Handlers
  const handleCompleteTask = (task: Task) => {
    crmStore.updateTaskStatus(orgSlug, task.id, "completed");
    setRefreshKey((k) => k + 1);
    toast("Task marked complete", { type: "success" });
  };

  const handleUndoTask = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "todo");
    setRefreshKey((k) => k + 1);
    toast("Task restored to active list", { type: "info" });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      title: taskTitle.trim(),
      due_date: taskDueDate,
      priority: taskPriority,
      status: "todo",
      contact_name: contactName || undefined,
    });

    setCreateModalOpen(false);
    setTaskTitle("");
    setContactName("");
    setRefreshKey((k) => k + 1);
    toast("Task scheduled", { type: "success" });
  };

  const renderTaskRow = (task: Task, isOverdue = false) => {
    const isCompleted = task.status === "completed";

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className="group flex items-center justify-between p-3.5 hover:bg-[#F6F5F1] transition-colors duration-140 cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0 pr-3">
          {/* One-Click Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isCompleted) {
                handleUndoTask(task.id);
              } else {
                handleCompleteTask(task);
              }
            }}
            className={cn(
              "flex h-4.5 w-4.5 items-center justify-center rounded-[4px] border transition-colors shrink-0",
              isCompleted
                ? "bg-[#0F7B5A] border-[#0F7B5A] text-white"
                : "border-[#D2CEC2] hover:border-[#FF5A1F] bg-white text-transparent"
            )}
            title={isCompleted ? "Restore task" : "Mark complete"}
          >
            <Check className="h-3 w-3" />
          </button>

          <div className="min-w-0">
            <span
              className={cn(
                "text-[13px] font-medium text-[#12141A] truncate block group-hover:underline",
                isCompleted && "line-through text-[#6A707C]"
              )}
            >
              {task.title}
            </span>
            {task.contact_name && (
              <span className="text-[11px] text-[#4B515D] truncate block mt-0.5">
                Client: {task.contact_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StatusPill
            variant={
              task.priority === "high"
                ? "danger"
                : task.priority === "medium"
                ? "warning"
                : "neutral"
            }
            size="sm"
          >
            {task.priority}
          </StatusPill>

          <span
            className={cn(
              "text-[11px] font-variant-numeric tabular-nums",
              isOverdue ? "text-[#B42318] font-medium" : "text-[#6A707C]"
            )}
          >
            {task.due_date}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#E4E1D8] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-medium leading-[36px] tracking-[-0.02em] text-[#12141A]">
            Tasks &amp; SLAs
          </h1>
          <p className="mt-1 text-[13px] text-[#4B515D]">
            {overdueTasks.length + todayTasks.length + upcomingTasks.length} pending SLAs •{" "}
            {overdueTasks.length === 0
              ? "Zero overdue"
              : `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} require immediate action`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6A707C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-8.5 w-full rounded-[8px] border border-[#E4E1D8] bg-white pl-8 pr-3 text-[12px] text-[#12141A] placeholder:text-[#6A707C] focus:border-[#FF5A1F] focus:outline-none shadow-hairline"
            />
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add task</span>
          </Button>
        </div>
      </div>

      {/* 2. CHRONOLOGICAL GROUPS (Overdue / Today / Upcoming) */}
      <div className="space-y-6">
        {/* OVERDUE GROUP */}
        {overdueTasks.length > 0 && (
          <div className="rounded-[14px] border border-[#F8D0CC] bg-white shadow-hairline overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F8D0CC] bg-[#FDECEA]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#B42318]" />
                <h2 className="text-[14px] font-medium text-[#B42318]">
                  Overdue SLAs ({overdueTasks.length})
                </h2>
              </div>
              <span className="text-[11px] text-[#B42318]">
                Requires immediate resolution
              </span>
            </div>
            <div className="divide-y divide-[#E4E1D8]">
              {overdueTasks.map((t) => renderTaskRow(t, true))}
            </div>
          </div>
        )}

        {/* TODAY GROUP */}
        <div className="rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E1D8] bg-white">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#A8650A]" />
              <h2 className="text-[14px] font-medium text-[#12141A]">
                Due Today ({todayTasks.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#6A707C]">
              Scheduled follow-up actions
            </span>
          </div>
          <div className="divide-y divide-[#E4E1D8]">
            {todayTasks.map((t) => renderTaskRow(t))}
            {todayTasks.length === 0 && (
              <div className="p-8 text-center text-[12px] text-[#6A707C]">
                All of today&apos;s tasks are completed.
              </div>
            )}
          </div>
        </div>

        {/* UPCOMING GROUP */}
        <div className="rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E4E1D8] bg-white">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B4258]" />
              <h2 className="text-[14px] font-medium text-[#12141A]">
                Upcoming ({upcomingTasks.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#6A707C]">
              Future customer SLAs
            </span>
          </div>
          <div className="divide-y divide-[#E4E1D8]">
            {upcomingTasks.map((t) => renderTaskRow(t))}
            {upcomingTasks.length === 0 && (
              <div className="p-8 text-center text-[12px] text-[#6A707C]">
                No upcoming follow-ups scheduled.
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED FEED */}
        {completedTasks.length > 0 && (
          <div className="rounded-[14px] border border-[#E4E1D8] bg-white shadow-hairline overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E4E1D8] bg-[#EFEDE7] text-[11px] font-medium text-[#6A707C] uppercase tracking-[0.06em]">
              Completed Tasks ({completedTasks.length})
            </div>
            <div className="divide-y divide-[#E4E1D8]">
              {completedTasks.slice(0, 5).map((t) => renderTaskRow(t))}
            </div>
          </div>
        )}
      </div>

      {/* 3. TASK DETAIL DRAWER */}
      <Drawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || "Task Details"}
        description={`Due: ${selectedTask?.due_date}`}
      >
        <div className="space-y-6 text-[13px]">
          <div className="p-4 rounded-[8px] bg-[#EFEDE7] space-y-2">
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Priority</span>
              <StatusPill
                variant={selectedTask?.priority === "high" ? "danger" : "warning"}
                size="sm"
              >
                {selectedTask?.priority}
              </StatusPill>
            </div>
            <div className="flex items-center justify-between text-[#4B515D]">
              <span>Status</span>
              <StatusPill
                variant={selectedTask?.status === "completed" ? "success" : "neutral"}
                size="sm"
              >
                {selectedTask?.status}
              </StatusPill>
            </div>
            {selectedTask?.contact_name && (
              <div className="flex items-center justify-between text-[#4B515D]">
                <span>Associated Client</span>
                <span className="font-medium text-[#12141A]">
                  {selectedTask.contact_name}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E4E1D8] flex items-center justify-between">
            {selectedTask?.status !== "completed" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedTask) handleCompleteTask(selectedTask);
                  setSelectedTask(null);
                }}
              >
                Mark as Completed
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (selectedTask) handleUndoTask(selectedTask.id);
                  setSelectedTask(null);
                }}
              >
                Restore Task
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 4. CREATE TASK MODAL */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <form onSubmit={handleCreateTask} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Task or SLA Reminder</DialogTitle>
            <DialogDescription>
              Schedule an operational follow-up for your team.
            </DialogDescription>
          </DialogHeader>

          <Input
            label="Task Title *"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
            placeholder="e.g. Call Priya Sharma to finalize quotation"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Due Date *"
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#4B515D]">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full h-9 px-3 rounded-[8px] border border-[#E4E1D8] bg-[#EFEDE7] text-[13px] text-[#12141A] outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <Input
            label="Client Contact (Optional)"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="e.g. Rahul Verma"
          />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Task
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
