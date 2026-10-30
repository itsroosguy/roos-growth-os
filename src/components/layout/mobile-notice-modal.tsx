"use client";

import React, { useState, useEffect } from "react";
import { Monitor, X, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

const DISMISSAL_KEY = "roos_mobile_notice_dismissed";

export function MobileNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkNotice = () => {
      try {
        const isDismissed = localStorage.getItem(DISMISSAL_KEY) === "true";
        if (isDismissed) {
          setIsOpen(false);
          return;
        }
        // Small screen mobile layout check (< 768px, phones only; tablets >= 768px are not treated as phones)
        if (window.innerWidth < 768) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch {
        // Handle unavailable or restricted localStorage
      }
    };

    // Check after brief delay to avoid flash during hydration
    const timer = setTimeout(checkNotice, 150);
    window.addEventListener("resize", checkNotice);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkNotice);
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(DISMISSAL_KEY, "true");
    } catch {
      // Safely ignore storage errors
    }
  };

  const handleCopyDesktopLink = async () => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast("Desktop link copied to clipboard", {
          message: "Paste on your computer to open the full layout.",
          type: "success",
        });
        setTimeout(() => {
          setCopied(false);
          handleDismiss();
        }, 1200);
      } else {
        handleDismiss();
      }
    } catch {
      handleDismiss();
    }
  };

  // Keyboard accessibility: Escape key dismisses modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
    >
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-150 animate-fade-in"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-sm rounded-[22px] border border-[#EDE8E0] bg-white p-5 sm:p-6 shadow-[0_20px_50px_rgba(11,13,18,0.22)] animate-scale-in">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-[8px] text-[#666C78] hover:bg-[#F7F5F0] hover:text-[#12141A] transition-colors cursor-pointer"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#FFF0EB] border border-[#FF5A1F]/20 text-[#FF5A1F] mb-4">
          <Monitor className="h-5 w-5" />
        </div>

        {/* Content */}
        <h3
          id="mobile-notice-title"
          className="text-[17px] sm:text-[18px] font-semibold text-[#12141A] tracking-[-0.01em] leading-snug"
        >
          We&apos;re optimising the mobile experience
        </h3>

        <p className="mt-2 text-[13.5px] leading-relaxed text-[#454B57] font-normal">
          Our desktop experience is currently the most complete and carefully aligned version of Roos StudioX Business OS. We&apos;re working on improving the mobile layout. You can continue exploring the application, but some screens may work better on a computer.
        </p>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full h-11 rounded-[12px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] text-white text-[14px] font-medium shadow-[0_2px_8px_rgba(255,90,31,0.3)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
          >
            Continue to app
          </button>

          <button
            type="button"
            onClick={handleCopyDesktopLink}
            className="w-full h-10 rounded-[12px] border border-[#EDE8E0] bg-white text-[#454B57] hover:bg-[#F7F5F0] hover:text-[#12141A] text-[13px] font-medium active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#12B886]" />
                <span className="text-[#12B886]">Link copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#666C78]" />
                <span>Copy desktop link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
