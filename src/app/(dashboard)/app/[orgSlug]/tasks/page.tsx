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
import { cn, formatDate } from "@/lib/utils";
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
    toast("Task Completed", {
      message: `"${task.title}" checked off.`,
      type: "success",
    });
  };

  const handleUndoTask = (taskId: string) => {
    crmStore.updateTaskStatus(orgSlug, taskId, "todo");
    setRefreshKey((k) => k + 1);
    toast("Task Restored", {
      message: "Restored to active agenda.",
      type: "info",
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    crmStore.createTask(orgSlug, {
      title: taskTitle.trim(),
      due_date: taskDueDate,
      priority: taskPriority,
      status: "todo",
      contact_name: contactName.trim() || undefined,
    });

    setCreateModalOpen(false);
    setTaskTitle("");
    setContactName("");
    setRefreshKey((k) => k + 1);
    toast("Task Scheduled", {
      message: "Added to operational agenda.",
      type: "success",
    });
  };

  const renderTaskRow = (task: Task, isOverdue = false) => {
    const isCompleted = task.status === "completed";

    return (
      <div
        key={task.id}
        onClick={() => setSelectedTask(task)}
        className={cn(
          "group flex items-center justify-between p-4 transition-colors duration-140 cursor-pointer",
          isOverdue ? "bg-[#FFE9EA]/25 hover:bg-[#FFE9EA]/40" : "hover:bg-[#F7F5F0]"
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-3">
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
              "flex h-5 w-5 items-center justify-center rounded-[6px] border transition-transform active:scale-95 shrink-0 cursor-pointer",
              isCompleted
                ? "bg-[#12B886] border-[#12B886] text-white"
                : isOverdue
                ? "border-[#E5484D] hover:bg-[#FFE9EA] text-transparent hover:text-[#B42336]"
                : "border-[#EDE8E0] hover:border-[#FF5A1F] bg-white text-transparent hover:text-[#FF5A1F]"
            )}
            title={isCompleted ? "Restore task" : "Mark complete"}
          >
            <Check className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0">
            <span
              className={cn(
                "text-[14.5px] font-semibold text-[#12141A] truncate block group-hover:text-[#FF5A1F] transition-colors",
                isCompleted && "line-through text-[#666C78]"
              )}
            >
              {task.title}
            </span>
            {task.contact_name && (
              <span className="text-[12.5px] text-[#666C78] truncate block mt-0.5">
                Client: {task.contact_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5 shrink-0">
          <StatusPill
            variant={
              task.priority === "high"
                ? "rose"
                : task.priority === "medium"
                ? "amber"
                : "neutral"
            }
            size="sm"
          >
            {task.priority}
          </StatusPill>

          <span
            className={cn(
              "text-[13px] tabular-nums",
              isOverdue ? "text-[#B42336] font-semibold" : "text-[#666C78]"
            )}
          >
            {formatDate(task.due_date)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-page-enter pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-3 pb-5 border-b border-[#EDE8E0] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-[#12141A] tracking-[-0.02em] leading-tight">
            Tasks &amp; SLAs
          </h1>
          <p className="mt-1 text-[14px] text-[#666C78] font-normal">
            {overdueTasks.length + todayTasks.length + upcomingTasks.length} pending SLAs •{" "}
            {overdueTasks.length === 0
              ? "Zero overdue"
              : `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} require immediate action`}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#666C78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-10 w-full rounded-[12px] border border-[#EDE8E0] bg-white pl-9 pr-3 text-[13.5px] text-[#12141A] placeholder:text-[#666C78] focus:border-[#FF5A1F] focus:outline-none shadow-xs"
            />
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2 text-[13.5px] h-10 px-4 rounded-[12px] font-semibold cursor-pointer"
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
          <div className="rounded-[16px] border border-[#FFCCD0] bg-white card-ref p-0 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#FFCCD0] bg-[#FFE9EA]">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5484D]" />
                <h2 className="text-[15px] font-semibold text-[#B42336]">
                  Overdue SLAs ({overdueTasks.length})
                </h2>
              </div>
              <span className="text-[12.5px] text-[#B42336] font-medium">
                Requires immediate resolution
              </span>
            </div>
            <div className="divide-y divide-[#EDE8E0]">
              {overdueTasks.map((t) => renderTaskRow(t, true))}
            </div>
          </div>
        )}

        {/* TODAY GROUP */}
        <div className="rounded-[16px] border border-[#EDE8E0] bg-white card-ref p-0 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#EDE8E0] bg-[#F7F5F0]">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F5A524]" />
              <h2 className="text-[15px] font-semibold text-[#12141A]">
                Due Today ({todayTasks.length})
              </h2>
            </div>
            <span className="text-[12.5px] text-[#666C78]">
              Scheduled follow-up actions
            </span>
          </div>
          <div className="divide-y divide-[#EDE8E0]">
            {todayTasks.map((t) => renderTaskRow(t))}
            {todayTasks.length === 0 && (
              <div className="p-8 text-center text-[13px] text-[#666C78]">
                All of today&apos;s tasks are completed.
              </div>
            )}
          </div>
        </div>

        {/* UPCOMING GROUP */}
        <div className="rounded-[16px] border border-[#EDE8E0] bg-white card-ref p-0 overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#EDE8E0] bg-[#F7F5F0]">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#666C78]" />
              <h2 className="text-[15px] font-semibold text-[#12141A]">
                Upcoming ({upcomingTasks.length})
              </h2>
            </div>
            <span className="text-[12.5px] text-[#666C78]">
              Future customer SLAs
            </span>
          </div>
          <div className="divide-y divide-[#EDE8E0]">
            {upcomingTasks.map((t) => renderTaskRow(t))}
            {upcomingTasks.length === 0 && (
              <div className="p-8 text-center text-[13px] text-[#666C78]">
                No upcoming follow-ups scheduled.
              </div>
            )}
          </div>
        </div>

        {/* COMPLETED FEED */}
        {completedTasks.length > 0 && (
          <div className="rounded-[16px] border border-[#EDE8E0] bg-white card-ref p-0 overflow-hidden shadow-xs">
            <div className="px-6 py-3.5 border-b border-[#EDE8E0] bg-[#F7F5F0] text-[12px] font-semibold text-[#666C78] uppercase tracking-wider">
              Completed Tasks ({completedTasks.length})
            </div>
            <div className="divide-y divide-[#EDE8E0]">
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
        <div className="space-y-6 text-[13.5px]">
          <div className="p-4 rounded-[14px] bg-[#F7F5F0] border border-[#EDE8E0] space-y-3">
            <div className="flex items-center justify-between text-[#666C78]">
              <span>Priority</span>
              <StatusPill
                variant={selectedTask?.priority === "high" ? "rose" : "amber"}
                size="sm"
              >
                {selectedTask?.priority}
              </StatusPill>
            </div>
            <div className="flex items-center justify-between text-[#666C78]">
              <span>Status</span>
              <StatusPill
                variant={selectedTask?.status === "completed" ? "emerald" : "neutral"}
                size="sm"
              >
                {selectedTask?.status}
              </StatusPill>
            </div>
            {selectedTask?.contact_name && (
              <div className="flex items-center justify-between text-[#666C78]">
                <span>Associated Client</span>
                <span className="font-semibold text-[#12141A]">
                  {selectedTask.contact_name}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#EDE8E0] flex items-center justify-between">
            {selectedTask?.status !== "completed" ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (selectedTask) handleCompleteTask(selectedTask);
                  setSelectedTask(null);
                }}
                className="text-[13.5px] rounded-[10px] h-9 px-4 font-semibold"
              >
                Mark as Completed
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedTask) handleUndoTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="text-[13.5px] rounded-[10px] h-9 px-4 border-[#EDE8E0]"
              >
                Mark as Incomplete
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => setSelectedTask(null)}
              className="text-[13.5px] rounded-[10px] h-9 px-3.5"
            >
              Close
            </Button>
          </div>
        </div>
      </Drawer>

      {/* 4. CREATE TASK MODAL */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <div className="bg-white rounded-[16px] p-2">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold text-[#12141A]">Add Follow-up Task</DialogTitle>
            <DialogDescription className="text-[13px] text-[#666C78]">
              Schedule a customer SLA or team action item.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div>
              <label className="text-[13px] text-[#12141A] block mb-1.5 font-medium">
                Task Title
              </label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Call client to confirm terms"
                required
                className="h-10 text-[13.5px] rounded-[12px] bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-[#12141A] block mb-1.5 font-medium">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  required
                  className="h-10 text-[13.5px] rounded-[12px] bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F]"
                />
              </div>

              <div>
                <label className="text-[13px] text-[#12141A] block mb-1.5 font-medium">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full h-10 px-3 rounded-[12px] bg-[#F7F5F0] border border-[#EDE8E0] text-[13.5px] text-[#12141A] focus:outline-none focus:border-[#FF5A1F] focus:bg-white cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent SLA</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[13px] text-[#12141A] block mb-1.5 font-medium">
                Associated Client Name (Optional)
              </label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="h-10 text-[13.5px] rounded-[12px] bg-[#F7F5F0] border-[#EDE8E0] focus:bg-white focus:border-[#FF5A1F]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EDE8E0]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateModalOpen(false)}
                className="text-[13px] rounded-[10px]"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="text-[13px] font-semibold rounded-[10px] px-4 cursor-pointer">
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
