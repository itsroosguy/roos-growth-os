import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#FF7A1A] to-[#FF8833] text-white font-extrabold shadow-md mb-4">
            <span className="text-2xl font-extrabold tracking-tighter">RX</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
            ROOS <span className="text-[#FF7A1A]">STUDIOX</span>
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Client Growth Portal &amp; Operating System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
