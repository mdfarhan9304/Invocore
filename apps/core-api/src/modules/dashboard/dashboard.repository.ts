import { InvoiceStatus, PaymentStatus, type PrismaClient } from "@invocore/database";

export class DashboardRepository {
  constructor(private readonly client: PrismaClient) {}

  async getSummary(organizationId: string) {
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const chartStart = new Date(today - 89 * 24 * 60 * 60 * 1000);
    const [totalRevenue, paidThisMonth, outstanding, overdue, recentInvoices, recentPayments] =
      await Promise.all([
        this.client.payment.aggregate({
          where: { organizationId, status: PaymentStatus.CAPTURED },
          _sum: { amount: true }
        }),
        this.client.payment.aggregate({
          where: {
            organizationId,
            status: PaymentStatus.CAPTURED,
            paidAt: { gte: monthStart }
          },
          _sum: { amount: true }
        }),
        this.client.invoice.aggregate({
          where: {
            organizationId,
            status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] }
          },
          _sum: { balanceDue: true },
          _count: { _all: true }
        }),
        this.client.invoice.aggregate({
          where: { organizationId, status: InvoiceStatus.OVERDUE },
          _sum: { balanceDue: true },
          _count: { _all: true }
        }),
        this.client.invoice.findMany({
          where: { organizationId },
          orderBy: { updatedAt: "desc" },
          take: 4,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            updatedAt: true,
            client: { select: { name: true } }
          }
        }),
        this.client.payment.findMany({
          where: {
            organizationId,
            status: PaymentStatus.CAPTURED,
            paidAt: { gte: chartStart }
          },
          orderBy: { paidAt: "asc" },
          select: { amount: true, paidAt: true }
        })
      ]);

    const revenueByDate = new Map<string, number>();
    for (const payment of recentPayments) {
      if (!payment.paidAt) continue;
      const dateKey = payment.paidAt.toISOString().slice(0, 10);
      revenueByDate.set(dateKey, (revenueByDate.get(dateKey) ?? 0) + payment.amount);
    }

    const revenueByDay = Array.from({ length: 90 }, (_, index) => {
      const date = new Date(chartStart.getTime() + index * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().slice(0, 10);
      return {
        date: dateKey,
        amount: revenueByDate.get(dateKey) ?? 0
      };
    });

    return {
      totalRevenue: totalRevenue._sum.amount ?? 0,
      paidThisMonth: paidThisMonth._sum.amount ?? 0,
      outstanding: outstanding._sum.balanceDue ?? 0,
      outstandingCount: outstanding._count._all,
      overdue: overdue._sum.balanceDue ?? 0,
      overdueCount: overdue._count._all,
      revenueByDay,
      recentInvoices: recentInvoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        clientName: invoice.client.name,
        updatedAt: invoice.updatedAt.toISOString()
      }))
    };
  }
}
