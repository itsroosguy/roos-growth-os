"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, KeyRound, Sparkles } from "lucide-react";

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
    // Allows UI preview when Supabase credentials are not yet entered in .env.local
    router.push("/app/acme-corp/overview");
  };

  return (
    <Card className="shadow-dropdown border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Sign in</CardTitle>
        <CardDescription>
          Access your business dashboard and WhatsApp CRM
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {!isSupabaseConfigured && (
            <div className="rounded-2xl bg-google-yellow-subtle p-3.5 border border-google-yellow/30 text-xs text-foreground flex items-start space-x-2.5">
              <KeyRound className="h-4 w-4 text-google-yellow-hover shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Supabase Setup Required</span>
                Add <code className="bg-white/80 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> to <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code> to enable live Supabase Auth.
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-google-red-subtle p-3.5 border border-google-red/20 text-xs text-google-red flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-xs">
            <Link
              href="/reset-password"
              className="text-google-blue hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {isSupabaseConfigured ? (
            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              Sign in with Supabase
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-google-blue hover:bg-google-blue-hover text-white shadow-sm font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4 text-white" />
              Sign in to Demo Workspace
            </Button>
          )}

          <p className="text-center text-xs text-foreground-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-google-blue hover:underline"
            >
              Create organisation
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
