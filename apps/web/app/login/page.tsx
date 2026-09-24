"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isInitializing } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isInitializing, isAuthenticated, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your organization's invoicing workspace."
      imageSrc="/images/invocore-auth-login.png"
      imageAlt="Rolling green hills with a path leading toward a distant lighthouse"
      imageEyebrow="Return to Invocore"
      imageCaption="Your workspace is waiting."
      footer={
        <span>
          Need an account?{" "}
          <Link href="/register" className="font-medium text-[#3c7560] hover:text-[#17352d]">
            Create one
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Field htmlFor="email" required>
          <Input
            id="email"
            aria-label="Email"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="h-11"
          />
        </Field>
        <Field htmlFor="password" required>
          <Input
            id="password"
            aria-label="Password"
            placeholder="Enter your password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="h-11"
          />
        </Field>
        <Button
          type="submit"
          className="hero-cta button-lift mt-2 h-11 w-full rounded-full text-[15px] font-semibold"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
