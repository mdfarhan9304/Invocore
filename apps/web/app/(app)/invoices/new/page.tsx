import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Button } from "@/components/ui/button";

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/invoices">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">New Invoice</h1>
      </div>
      <InvoiceForm />
    </div>
  );
}
