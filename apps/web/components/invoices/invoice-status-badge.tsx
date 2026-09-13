import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/lib/api/types";

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ISSUED: { label: "Issued", variant: "outline" },
  SENT: { label: "Sent", variant: "default" },
  PARTIALLY_PAID: { label: "Partial", variant: "outline" },
  PAID: { label: "Paid", variant: "default" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "secondary" }
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
