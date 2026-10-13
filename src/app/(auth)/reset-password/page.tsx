"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

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
    <Card className="shadow-dropdown border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Reset password</CardTitle>
        <CardDescription>
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      {success ? (
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-google-green-subtle p-4 border border-google-green/20 text-xs text-google-green flex items-start space-x-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Check your email</span>
              We have sent a secure password reset link to <span className="font-semibold">{email}</span>.
            </div>
          </div>
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to sign in
            </Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-google-red-subtle p-3.5 border border-google-red/20 text-xs text-google-red flex items-start space-x-2">
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
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={!isSupabaseConfigured}
            >
              Send password reset link
            </Button>

            <Link
              href="/login"
              className="text-center text-xs text-foreground-secondary hover:text-foreground font-medium flex items-center justify-center space-x-1"
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
