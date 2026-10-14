import { AppError } from "@invocore/shared";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const DELIVERY_TIMEOUT_MS = 10_000;

export type VerificationEmailSender = {
  send(input: {
    email: string;
    idempotencyKey: string;
    organizationName?: string;
    token: string;
    userName: string;
  }): Promise<void>;
};

type ResendVerificationEmailConfig = {
  appUrl: string;
  resendApiKey: string;
  resendFrom: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function createVerificationUrl(appUrl: string, token: string): string {
  const verificationUrl = new URL("/verify-email", appUrl);
  verificationUrl.searchParams.set("token", token);
  return verificationUrl.toString();
}

export function createResendVerificationEmailSender(
  config: ResendVerificationEmailConfig
): VerificationEmailSender {
  return {
    async send(input) {
      if (!config.resendApiKey || !config.resendFrom) {
        throw new AppError(
          "Verification email delivery is not configured",
          "VERIFICATION_EMAIL_NOT_CONFIGURED",
          503
        );
      }

      const verificationUrl = createVerificationUrl(config.appUrl, input.token);
      const safeName = escapeHtml(input.userName);
      const workspaceLine = input.organizationName
        ? `<p>Confirm your email to activate <strong>${escapeHtml(input.organizationName)}</strong> on Invocore.</p>`
        : "<p>Confirm your email to activate your Invocore account.</p>";
      const workspaceText = input.organizationName
        ? `Confirm your email to activate ${input.organizationName} on Invocore.`
        : "Confirm your email to activate your Invocore account.";

      const html = [
        `<p>Hi ${safeName},</p>`,
        workspaceLine,
        `<p><a href="${verificationUrl}">Verify email address</a></p>`,
        "<p>This link expires in 24 hours.</p>"
      ].join("");
      const text = [
        `Hi ${input.userName},`,
        "",
        workspaceText,
        "",
        `Verify email address: ${verificationUrl}`,
        "",
        "This link expires in 24 hours."
      ].join("\n");

      let response: Response;
      try {
        response = await fetch(RESEND_EMAILS_URL, {
          body: JSON.stringify({
            from: config.resendFrom,
            html,
            subject: "Verify your Invocore email",
            text,
            to: [input.email]
          }),
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": input.idempotencyKey
          },
          method: "POST",
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS)
        });
      } catch {
        throw new AppError(
          "Unable to deliver the verification email",
          "VERIFICATION_EMAIL_DELIVERY_FAILED",
          502
        );
      }

      if (!response.ok) {
        throw new AppError(
          "Unable to deliver the verification email",
          "VERIFICATION_EMAIL_DELIVERY_FAILED",
          502
        );
      }
    }
  };
}
