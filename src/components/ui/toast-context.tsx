"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (title: string, options?: { message?: string; type?: ToastType; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (title: string, options?: { message?: string; type?: ToastType; duration?: number }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        title,
        message: options?.message,
        type: options?.type || "success",
      };

      setToasts((prev) => [...prev, newToast]);

      const duration = options?.duration || 3200;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${
              t.type === "success"
                ? "bg-slate-950/95 text-white border-slate-800"
                : t.type === "error"
                ? "bg-rose-950/95 text-white border-rose-800"
                : t.type === "warning"
                ? "bg-amber-950/95 text-white border-amber-800"
                : "bg-slate-900/95 text-white border-slate-800"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {t.type === "info" && <Info className="h-5 w-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-sm font-semibold text-white leading-tight font-display">{t.title}</h4>
              {t.message && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-normal">{t.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      toast: (title: string, options?: { message?: string; type?: ToastType }) => {
        console.log(`[Toast] ${title}`, options);
      },
    };
  }
  return context;
}
