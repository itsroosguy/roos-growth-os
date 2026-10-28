"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  duration?: number; // ms, default 750ms
  delay?: number; // ms stagger, default 0ms
  format?: "currency" | "percent" | "integer" | "decimal";
  currencySymbol?: string; // default "$"
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 750,
  delay = 0,
  format = "integer",
  currencySymbol = "$",
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    // On initial mount count up from 0
    if (!hasAnimated) {
      let startTimestamp: number | null = null;
      let animationFrameId: number;

      const timer = setTimeout(() => {
        const step = (timestamp: number) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          // Ease-out cubic: 1 - pow(1 - progress, 3)
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(value * easeOut);
          setDisplayValue(current);

          if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
          } else {
            setDisplayValue(value);
            setHasAnimated(true);
          }
        };
        animationFrameId = requestAnimationFrame(step);
      }, delay);

      return () => {
        clearTimeout(timer);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    } else if (prevValueRef.current !== value) {
      // Live value update: soft flame highlight
      setIsUpdating(true);
      setDisplayValue(value);
      prevValueRef.current = value;
      const highlightTimer = setTimeout(() => {
        setIsUpdating(false);
      }, 1200);
      return () => clearTimeout(highlightTimer);
    }
  }, [value, duration, delay, hasAnimated]);

  const formatNumber = (num: number) => {
    switch (format) {
      case "currency":
        return `${currencySymbol}${num.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      case "percent":
        return `${num}%`;
      case "decimal":
        return num.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      default:
        return num.toLocaleString("en-US");
    }
  };

  return (
    <span
      className={cn(
        "font-variant-numeric tabular-nums inline-block transition-colors duration-300",
        isUpdating && "bg-[#FFF1EA] text-[#C73E0C] px-1 rounded",
        className
      )}
    >
      {formatNumber(displayValue)}
    </span>
  );
}
