"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cleanSlug } from "@/lib/organizations/slug";
import { AlertCircle, KeyRound } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleSignup = async (e: React.FormEvent) => {
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

      const generatedSlug = cleanSlug(orgName);
      if (!generatedSlug || generatedSlug.length < 2) {
        throw new Error("Please enter a valid organisation name (minimum 2 characters).");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            initial_org_name: orgName,
            initial_org_slug: generatedSlug,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        router.push(`/app/${generatedSlug}/overview`);
      } else {
        router.push("/login?message=Check your email to confirm your account.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create account.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-dropdown border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-bold">Create organisation</CardTitle>
        <CardDescription>
          Get started with your multi-tenant business workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          {!isSupabaseConfigured && (
            <div className="rounded-2xl bg-google-yellow-subtle p-3.5 border border-google-yellow/30 text-xs text-foreground flex items-start space-x-2.5">
              <KeyRound className="h-4 w-4 text-google-yellow-hover shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Supabase Setup Required</span>
                Add <code className="bg-white/80 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> to <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code> to enable real account creation.
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
            label="Your Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Organisation / Business Name"
            type="text"
            placeholder="Acme Technologies"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          {orgName && (
            <p className="text-[11px] text-foreground-secondary">
              Workspace URL: <span className="font-mono text-google-blue">/app/{cleanSlug(orgName)}</span>
            </p>
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

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
            disabled={!isSupabaseConfigured}
          >
            Create account & workspace
          </Button>

          <p className="text-center text-xs text-foreground-secondary">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-google-blue hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
