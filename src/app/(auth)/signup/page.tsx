"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cleanSlug } from "@/lib/organizations/slug";
import { AlertCircle, KeyRound, ArrowRight } from "lucide-react";

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
      const generatedSlug = cleanSlug(orgName);
      if (!generatedSlug || generatedSlug.length < 2) {
        throw new Error("Please enter a valid organisation name (minimum 2 characters).");
      }

      if (!isSupabaseConfigured) {
        // Direct transition in demo mode
        router.push(`/app/${generatedSlug}/overview`);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        throw new Error(
          "Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
        );
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
    <Card className="max-w-md w-full mx-auto border-[#E5E5E7] bg-white rounded-2xl shadow-xs overflow-hidden">
      <CardHeader className="space-y-1 p-6 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight text-[#0D0D0E]">Create organisation</CardTitle>
        <CardDescription className="text-xs text-[#8E8E93]">
          Get started with your multi-tenant business workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4 px-6">
          {!isSupabaseConfigured && (
            <div className="rounded-xl bg-[#24180E] p-3.5 border border-[#FF7900]/25 text-xs text-white flex items-start space-x-2.5">
              <KeyRound className="h-4 w-4 text-[#FF7900] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#FF7900] block mb-0.5">Local Development Mode</span>
                <span className="text-[#8E8E93] leading-relaxed">
                  Workspace creation will generate an immediate isolated tenant.
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
            <p className="text-[11px] text-[#8E8E93]">
              Workspace URL: <span className="font-mono text-[#FF7900] font-semibold">/app/{cleanSlug(orgName)}</span>
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
        <CardFooter className="flex flex-col space-y-3 p-6 pt-4">
          <Button
            type="submit"
            className="w-full bg-[#FF7900] hover:bg-[#E66D00] text-white font-semibold rounded-xl h-10 shadow-xs transition-colors flex items-center justify-center gap-2"
            isLoading={loading}
          >
            <span>Create Workspace</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </Button>

          <p className="text-center text-xs text-[#8E8E93]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#FF7900] hover:text-[#E66D00] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
