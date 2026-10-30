import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F3EE] p-4 text-center">
      <h1 className="text-[34px] font-semibold text-[#12141A] tracking-tight">404 - Page Not Found</h1>
      <p className="mt-2 text-[15px] text-[#666C78]">The page you requested could not be located in this workspace.</p>
      <Link
        href="/app/acme-corp/overview"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-[12px] bg-gradient-to-b from-[#FF7A3D] to-[#FF5A1F] px-5 text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(255,90,31,0.3)] hover:opacity-95"
      >
        Return to Overview
      </Link>
    </div>
  );
}
