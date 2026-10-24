"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RoosLogo } from "@/components/ui/roos-logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Building2,
  Mail,
  Phone,
  User,
  X,
  Send,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Try Demo" Modal states
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoFullName, setDemoFullName] = useState("");
  const [demoOrgName, setDemoOrgName] = useState("");
  const [demoWorkEmail, setDemoWorkEmail] = useState("");
  const [demoContactPhone, setDemoContactPhone] = useState("");
  const [demoTeamSize, setDemoTeamSize] = useState("1-10 Members");
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      router.push("/app/acme-corp/overview");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error(
          "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
        );
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/app/acme-corp/overview");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError(null);
    setDemoSubmitting(true);

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: demoFullName,
          organizationName: demoOrgName,
          workEmail: demoWorkEmail,
          contactPhone: demoContactPhone,
          teamSize: demoTeamSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit demo request.");
      }

      setDemoSuccess(true);
    } catch (err: any) {
      setDemoError(err.message || "Failed to submit demo request.");
    } finally {
      setDemoSubmitting(false);
    }
  };

  const resetDemoModal = () => {
    setDemoModalOpen(false);
    setDemoSuccess(false);
    setDemoError(null);
    setDemoFullName("");
    setDemoOrgName("");
    setDemoWorkEmail("");
    setDemoContactPhone("");
  };

  return (
    <div className="w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl bg-white border border-black/5 flex flex-col lg:flex-row min-h-[640px] animate-fadeIn">
      {/* ===================================================================== */}
      {/* LEFT PANEL: HERO & VALUE PROPOSITION (DARK ELEVATED SURFACE)          */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-[48%] bg-[#0D0D0E] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle Warm Amber / Orange Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#FF7900]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FF7900]/10 blur-3xl pointer-events-none" />

        {/* Clean Top Spacer on Dark Panel */}
        <div className="relative z-10 h-4" />

        {/* Centered Brand Presentation */}
        <div className="relative z-10 py-10 flex flex-col items-center text-center">
          {/* Official ROOS Emblem Squircle (Replacing old RX text) */}
          <div className="h-20 w-20 rounded-3xl overflow-hidden shadow-2xl mb-8 group hover:scale-105 transition-transform duration-300 border border-[#27272A] bg-black flex items-center justify-center p-2.5">
            <img
              src="/mark.png"
              alt="ROOS STUDIOX"
              className="h-full w-full object-contain"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            One Platform to Streamline
            <span className="block text-slate-300 mt-1">All WhatsApp CRM &amp; Pipeline</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#8E8E93] mt-3.5 leading-relaxed max-w-sm mx-auto font-normal">
            Automate customer journeys, manage commercial deal stages, and empower 3-tier team governance in one unified workspace.
          </p>

          {/* Carousel Indicator Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <span className="w-6 h-1.5 rounded-full bg-[#FF7900]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Bottom Left Meta on Dark Panel */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-[#71717A] font-mono border-t border-[#1C1C20] pt-4">
          <span>ROOS STUDIOX ENTERPRISE</span>
          <span>v2.4 SECURE</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT PANEL: SIGN IN & TRY DEMO FORM (PURE WHITE SURFACE)             */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-[52%] bg-white p-8 sm:p-12 flex flex-col justify-between">
        {/* Top Header with Brand Logo (Removed "Don't have an account? Sign Up") */}
        <div className="flex items-center justify-between pb-6">
          <Link href="/" className="inline-flex items-center" title="ROOS STUDIOX">
            <RoosLogo variant="dark" size="sm" />
          </Link>
        </div>

        {/* Centered Form */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0D0D0E]">
              Welcome back to ROOS!
            </h1>
            <p className="text-xs text-[#8E8E93] mt-1.5">
              Please enter your details to sign in your account
            </p>
          </div>

          {/* Social Sign-in Buttons */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              onClick={() => router.push("/app/acme-corp/overview")}
              className="w-full h-11 rounded-xl border border-[#E5E5E7] hover:border-[#0D0D0E] hover:bg-[#F7F7F8] text-xs font-semibold text-[#0D0D0E] flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/app/acme-corp/overview")}
              className="w-full h-11 rounded-xl border border-[#E5E5E7] hover:border-[#0D0D0E] hover:bg-[#F7F7F8] text-xs font-semibold text-[#0D0D0E] flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.03-.52 2.68-1.27z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E7]" />
            </div>
            <div className="relative flex justify-center text-[11px] text-[#8E8E93]">
              <span className="bg-white px-3 font-medium">Or sign in with</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {error && (
              <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0D0D0E] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="johndoe@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 rounded-xl border border-[#E5E5E7] bg-white px-3.5 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0D0D0E] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="minimum 8 character"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl border border-[#E5E5E7] bg-white px-3.5 pr-10 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#0D0D0E] transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS ROW: SIGN IN + TRY DEMO SIDE-BY-SIDE */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {/* Primary Sign In Button */}
              <Button
                type="submit"
                isLoading={loading}
                className="w-full sm:flex-1 h-11 bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              {/* Try Demo Button with Official ROOS Brand Emblem */}
              <Button
                type="button"
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:flex-1 h-11 bg-[#0D0D0E] hover:bg-[#1C1C1F] text-white border border-[#27272A] font-semibold rounded-xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer group"
              >
                <div className="h-5 w-5 rounded-md overflow-hidden shrink-0 border border-white/10 flex items-center justify-center bg-black p-0.5 group-hover:scale-105 transition-transform">
                  <img
                    src="/mark.png"
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <span>Try Demo</span>
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/reset-password"
                className="text-xs text-[#8E8E93] hover:text-[#0D0D0E] font-medium underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom Footer (Cleaned, no Orion) */}
        <div className="flex items-center justify-between text-[11px] text-[#8E8E93] border-t border-[#E5E5E7] pt-4 mt-6">
          <span>© 2026 ROOS STUDIOX</span>
          <div className="flex items-center space-x-3">
            <a href="https://roosstudiox.com" target="_blank" rel="noreferrer" className="hover:text-[#0D0D0E] transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="mailto:praveen@roosstudiox.com" className="hover:text-[#0D0D0E] transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* "TRY DEMO" MODAL DIALOG (DISPATCHES DIRECTLY TO PRAVEEN@ROOSSTUDIOX.COM)*/}
      {/* ===================================================================== */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-[#E5E5E7] overflow-hidden text-[#0D0D0E]">
            {demoSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-[#0D0D0E]">
                    Demo Request Dispatched!
                  </h3>
                  <p className="text-xs text-[#8E8E93] mt-2 leading-relaxed">
                    Your details have been forwarded to <strong className="text-[#0D0D0E]">Praveen Raj (praveen@roosstudiox.com)</strong>.
                  </p>
                  <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
                    Custom workspace credentials for <strong className="text-[#0D0D0E]">{demoOrgName}</strong> will be prepared and delivered to <strong className="text-[#0D0D0E]">{demoWorkEmail}</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`mailto:praveen@roosstudiox.com?subject=Demo%20Request%20Follow-up%20for%20${encodeURIComponent(demoOrgName)}&body=Hi%20Praveen,%0A%0AI%20just%20submitted%20a%20demo%20request%20on%20Growth%20OS%20for%20${encodeURIComponent(demoOrgName)}.%0AName:%20${encodeURIComponent(demoFullName)}%0APhone:%20${encodeURIComponent(demoContactPhone)}%0AEmail:%20${encodeURIComponent(demoWorkEmail)}%0A`}
                    className="w-full h-10 rounded-xl bg-[#24180E] text-[#FF7900] border border-[#FF7900]/30 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#FF7900] hover:text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Send Quick Note to Praveen</span>
                  </a>

                  <Button
                    type="button"
                    onClick={resetDemoModal}
                    className="w-full h-10 bg-[#0D0D0E] hover:bg-[#1C1C1F] text-white rounded-xl text-xs font-semibold"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit}>
                {/* Modal Header */}
                <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between bg-[#F7F7F8]">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-xl bg-black border border-[#27272A] flex items-center justify-center p-1.5 overflow-hidden">
                      <img src="/mark.png" alt="" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0D0D0E]">Request Demo Access</h3>
                      <p className="text-[11px] text-[#8E8E93]">Credentials dispatched by Praveen over email</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetDemoModal}
                    className="text-[#8E8E93] hover:text-[#0D0D0E] p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Form Fields */}
                <div className="p-6 space-y-3.5 text-xs">
                  {demoError && (
                    <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{demoError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[#0D0D0E] mb-1">Your Full Name *</label>
                    <div className="relative">
                      <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={demoFullName}
                        onChange={(e) => setDemoFullName(e.target.value)}
                        required
                        className="w-full h-10 rounded-xl border border-[#E5E5E7] bg-white pl-9 pr-3 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0D0E] mb-1">Organisation / Business Name *</label>
                    <div className="relative">
                      <Building2 className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="text"
                        placeholder="e.g. Acme Technologies"
                        value={demoOrgName}
                        onChange={(e) => setDemoOrgName(e.target.value)}
                        required
                        className="w-full h-10 rounded-xl border border-[#E5E5E7] bg-white pl-9 pr-3 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0D0E] mb-1">Work Email ID *</label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={demoWorkEmail}
                        onChange={(e) => setDemoWorkEmail(e.target.value)}
                        required
                        className="w-full h-10 rounded-xl border border-[#E5E5E7] bg-white pl-9 pr-3 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0D0E] mb-1">Contact Phone / WhatsApp *</label>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={demoContactPhone}
                        onChange={(e) => setDemoContactPhone(e.target.value)}
                        required
                        className="w-full h-10 rounded-xl border border-[#E5E5E7] bg-white pl-9 pr-3 text-xs text-[#0D0D0E] placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#FF7900]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0D0D0E] mb-1">Expected Team Size</label>
                    <select
                      value={demoTeamSize}
                      onChange={(e) => setDemoTeamSize(e.target.value)}
                      className="w-full h-10 rounded-xl border border-[#E5E5E7] bg-white px-3 text-xs text-[#0D0D0E] focus:outline-hidden focus:border-[#FF7900]"
                    >
                      <option value="1-5 Operators">1-5 Operators (Starter OS)</option>
                      <option value="6-20 Team Members">6-20 Team Members (Growth OS)</option>
                      <option value="20+ Enterprise">20+ Operators (Enterprise Custom)</option>
                    </select>
                  </div>

                  <div className="rounded-xl bg-[#24180E] p-3 border border-[#FF7900]/25 text-[11px] text-[#8E8E93] leading-relaxed flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#FF7900] shrink-0" />
                    <span>Notification automatically dispatched to <strong className="text-white">praveen@roosstudiox.com</strong> for approval.</span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-[#F7F7F8] border-t border-[#E5E5E7] flex items-center justify-end space-x-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetDemoModal}
                    className="h-10 text-xs border-[#E5E5E7] text-[#0D0D0E]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={demoSubmitting}
                    className="h-10 bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <span>Request Credentials</span>
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
