import { AppError } from "@invocore/shared";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";
const DELIVERY_TIMEOUT_MS = 10_000;

export type InvitationEmailSender = {
  send(input: {
    acceptToken: string;
    email: string;
    idempotencyKey: string;
    organizationName: string;
  }): Promise<void>;
};

type ResendInvitationEmailConfig = {
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

function createInvitationUrl(appUrl: string, acceptToken: string): string {
  const invitationUrl = new URL("/invite", appUrl);
  invitationUrl.hash = new URLSearchParams({ token: acceptToken }).toString();

  return invitationUrl.toString();
}

export function createResendInvitationEmailSender(
  config: ResendInvitationEmailConfig
): InvitationEmailSender {
  return {
    async send(input) {
      if (!config.resendApiKey || !config.resendFrom) {
        throw new AppError(
          "Invitation email delivery is not configured",
          "INVITATION_EMAIL_NOT_CONFIGURED",
          503
        );
      }

      const invitationUrl = createInvitationUrl(config.appUrl, input.acceptToken);
      const organizationName = escapeHtml(input.organizationName);
      const html = [
        `<p>You have been invited to join <strong>${organizationName}</strong> on Invocore.</p>`,
        `<p><a href="${invitationUrl}">Accept invitation</a></p>`,
        "<p>This invitation expires in 7 days.</p>"
      ].join("");
      const text = [
        `You have been invited to join ${input.organizationName} on Invocore.`,
        "",
        `Accept invitation: ${invitationUrl}`,
        "",
        "This invitation expires in 7 days."
      ].join("\n");

      let response: Response;
      try {
        response = await fetch(RESEND_EMAILS_URL, {
          body: JSON.stringify({
            from: config.resendFrom,
            html,
            subject: "You are invited to Invocore",
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
          "Unable to deliver the invitation email",
          "INVITATION_EMAIL_DELIVERY_FAILED",
          502
        );
      }

      if (!response.ok) {
        throw new AppError(
          "Unable to deliver the invitation email",
          "INVITATION_EMAIL_DELIVERY_FAILED",
          502
        );
      }
    }
  };
}
