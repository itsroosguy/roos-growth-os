import React from "react";
import { RoosLogo } from "@/components/ui/roos-logo";
import { ShieldCheck, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F8] p-4 sm:p-6 lg:p-8 selection:bg-[#FF7900] selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex items-center justify-center">
            <RoosLogo variant="dark" size="lg" />
          </div>
        </div>

        {/* Content Card */}
        {children}

        {/* Trust Badges */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[11px] text-[#8E8E93]">
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-[#FF7900]" />
            <span>256-bit SSL</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>3-Tier RBAC Protected</span>
          </span>
        </div>
      </div>
    </div>
  );
}
