"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Mock success in local dev
        setTimeout(() => {
          setSuccess(true);
          setLoading(false);
        }, 500);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error(
          "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
        );
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password/update`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send reset link.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full mx-auto border-[#E5E5E7] bg-white rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="space-y-1 p-6 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight text-[#0D0D0E]">Reset password</CardTitle>
        <CardDescription className="text-xs text-[#8E8E93]">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      {success ? (
        <CardContent className="space-y-4 p-6 pt-2">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Check your email</span>
              We have sent a secure password reset link to <span className="font-semibold text-emerald-950">{email}</span>.
            </div>
          </div>
          <Link href="/login" className="block w-full pt-2">
            <Button variant="outline" className="w-full border-[#E5E5E7] text-[#0D0D0E] hover:border-[#FF7900] hover:text-[#FF7900] rounded-xl h-10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to sign in
            </Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4 px-6">
            {error && (
              <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 p-6 pt-4">
            <Button
              type="submit"
              className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl h-10 shadow-xs transition-colors flex items-center justify-center gap-2"
              isLoading={loading}
            >
              <Mail className="h-4 w-4" />
              <span>Send password reset link</span>
            </Button>

            <Link
              href="/login"
              className="text-center text-xs text-[#8E8E93] hover:text-[#0D0D0E] font-medium flex items-center justify-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
