import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "dark" | "hero";
    hoverLift?: boolean;
  }
>(({ className, variant = "default", hoverLift = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[16px] transition-all duration-160 ease-out",
      variant === "dark" || variant === "hero"
        ? "bg-[#12151C] border border-[#242A38] text-[#F4F5F7] shadow-[0_1px_2px_rgba(11,13,18,.04),0_10px_28px_-14px_rgba(11,13,18,.14)] relative overflow-hidden"
        : "bg-white border border-[#EDE8E0] text-[#12141A] shadow-[0_1px_2px_rgba(11,13,18,.04),0_10px_28px_-14px_rgba(11,13,18,.14)]",
      hoverLift && "hover:-translate-y-[2px] transition-transform duration-160",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[20px] font-semibold leading-tight tracking-tight text-[#12141A]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[13px] text-[#666C78] font-normal leading-normal", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
