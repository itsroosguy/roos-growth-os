"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, KeyRound, Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      router.push("/app");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    router.push("/app/acme-corp/overview");
  };

  return (
    <Card className="border-[#E5E5E7] bg-white rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="space-y-1 p-6 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-[#0D0D0E]">Sign in</CardTitle>
        <CardDescription className="text-xs text-[#8E8E93]">
          Access your business dashboard and WhatsApp CRM
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 px-6">
          {!isSupabaseConfigured && (
            <div className="rounded-xl bg-[#24180E] p-3.5 border border-[#FF7900]/25 text-xs text-white flex items-start space-x-2.5">
              <KeyRound className="h-4 w-4 text-[#FF7900] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#FF7900] block mb-0.5">Local Development Mode</span>
                <span className="text-[#8E8E93] leading-relaxed">
                  Clicking sign in will instantly launch the configured demo workspace.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <Link
              href="/reset-password"
              className="text-[#FF7900] hover:text-[#E66D00] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 p-6 pt-4">
          {isSupabaseConfigured ? (
            <Button
              type="submit"
              className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl h-10 shadow-xs transition-colors"
              isLoading={loading}
            >
              Sign in with Supabase
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl h-10 shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-white" />
              <span>Launch Demo Workspace</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          )}

          <p className="text-center text-xs text-[#8E8E93]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#FF7900] hover:text-[#E66D00] hover:underline"
            >
              Create organisation
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
