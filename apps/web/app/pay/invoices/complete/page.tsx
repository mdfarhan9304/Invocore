import Link from "next/link";
import { CheckCircleIcon } from "lucide-react";

export default function PaymentCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircleIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Payment submitted</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We are verifying the payment with our payment provider. The invoice will be marked paid
          after verification.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Return to Invocore
        </Link>
      </div>
    </main>
  );
}
