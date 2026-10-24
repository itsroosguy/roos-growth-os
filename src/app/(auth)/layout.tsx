import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ECE9E2] p-4 sm:p-6 lg:p-10 selection:bg-[#FF7900] selection:text-white">
      {children}
    </div>
  );
}
