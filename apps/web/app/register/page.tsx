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

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isInitializing } = useAuth();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
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
      await register({
        name,
        email,
        password,
        organizationName: organizationName.trim() ? organizationName.trim() : undefined
      });
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to create your account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Start your workspace"
      subtitle="Set up your organization to manage clients and invoices."
      imageSrc="/images/invocore-auth-register.png"
      imageAlt="Sunrise over green hills with a small cottage and a path beginning in the grass"
      imageEyebrow="Begin with Invocore"
      imageCaption="A quieter place to get paid."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#3c7560] hover:text-[#17352d]">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error ? <FormAlert>{error}</FormAlert> : null}
        <Field htmlFor="name" required>
          <Input
            id="name"
            aria-label="Your name"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-11"
          />
        </Field>
        <Field htmlFor="organizationName" hint="Optional — defaults to your name.">
          <Input
            id="organizationName"
            aria-label="Organization name"
            placeholder="Organization name (optional)"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            className="h-11"
          />
        </Field>
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
        <Field htmlFor="password" required hint="At least 8 characters.">
          <Input
            id="password"
            aria-label="Password"
            placeholder="At least 8 characters"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="h-11"
          />
        </Field>
        <Button
          type="submit"
          className="hero-cta button-lift mt-2 h-11 w-full rounded-full text-[15px] font-semibold"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
