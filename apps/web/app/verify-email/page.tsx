"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { updateSessionUser } from "@/lib/session";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, isAuthenticated, isInitializing, resendVerificationEmail, logout } = useAuth();
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const verifyWithToken = useCallback(
    async (verificationToken: string) => {
      setStatus("verifying");
      setMessage(null);

      try {
        const result = await authApi.verifyEmail(verificationToken);
        if (isAuthenticated) {
          updateSessionUser(result.user);
        }
        setStatus("verified");
        setMessage("Your email is verified. You can open your workspace.");
      } catch (verifyError) {
        setStatus("error");
        setMessage(
          verifyError instanceof ApiError
            ? verifyError.message
            : "This verification link is invalid or has expired."
        );
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (!token || status !== "idle") {
      return;
    }

    void verifyWithToken(token);
  }, [token, status, verifyWithToken]);

  useEffect(() => {
    if (!isInitializing && user?.emailVerified) {
      router.replace("/dashboard");
    }
  }, [isInitializing, user?.emailVerified, router]);

  async function handleResend() {
    setResending(true);
    setMessage(null);

    try {
      await resendVerificationEmail();
      setMessage("We sent a new verification link to your inbox.");
    } catch (resendError) {
      setMessage(
        resendError instanceof ApiError
          ? resendError.message
          : "Unable to resend the verification email. Try again shortly."
      );
    } finally {
      setResending(false);
    }
  }

  const showWaiting = !token && isAuthenticated && user && !user.emailVerified;
  const showSignInPrompt = !isAuthenticated && !token;

  return (
    <AuthCard
      title="Verify your email"
      subtitle="We need to confirm your address before you can use invoices, clients, and the rest of your workspace."
      imageSrc="/images/invocore-auth-register.png"
      imageAlt="Sunrise over green hills"
      imageEyebrow="Almost there"
      imageCaption="One quick step before you get started."
      footer={
        <span>
          Wrong account?{" "}
          <button
            type="button"
            className="font-medium text-[#3c7560] hover:text-[#17352d]"
            onClick={() => void logout().then(() => router.replace("/login"))}
          >
            Sign out
          </button>
        </span>
      }
    >
      <div className="space-y-5">
        {message ? <FormAlert>{message}</FormAlert> : null}

        {token && status === "verifying" ? (
          <p className="text-sm text-muted-foreground">Confirming your email…</p>
        ) : null}

        {showWaiting ? (
          <>
            <p className="text-sm text-muted-foreground">
              We emailed a link to <span className="font-medium text-foreground">{user.email}</span>
              . Open it on this device, or resend the message below.
            </p>
            <Button
              type="button"
              className="hero-cta button-lift h-11 w-full rounded-full text-[15px] font-semibold"
              disabled={resending}
              onClick={() => void handleResend()}
            >
              {resending ? "Sending…" : "Resend verification email"}
            </Button>
          </>
        ) : null}

        {showSignInPrompt ? (
          <p className="text-sm text-muted-foreground">
            Sign in after clicking the link in your email, or{" "}
            <Link href="/login" className="font-medium text-[#3c7560] hover:text-[#17352d]">
              open the sign-in page
            </Link>
            .
          </p>
        ) : null}

        {status === "verified" ? (
          <Button
            type="button"
            className="hero-cta button-lift h-11 w-full rounded-full text-[15px] font-semibold"
            onClick={() => router.replace("/dashboard")}
          >
            Go to dashboard
          </Button>
        ) : null}

        {!isAuthenticated && token && status === "verified" ? (
          <Button
            type="button"
            className="hero-cta button-lift h-11 w-full rounded-full text-[15px] font-semibold"
            onClick={() => router.replace("/login")}
          >
            Sign in
          </Button>
        ) : null}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
