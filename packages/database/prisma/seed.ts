import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { InvoiceStatus, PaymentStatus, prisma, Role } from "../src/index.js";

const scrypt = promisify(scryptCallback);
const dayMs = 24 * 60 * 60 * 1000;

type SeedInvoice = {
  invoiceNumber: string;
  clientId: string;
  status: InvoiceStatus;
  issueDaysAgo: number;
  dueDaysFromIssue: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  productId: string;
  description: string;
  notes: string;
  terms: string;
  paidDaysAgo?: number;
  paymentMethod?: string;
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

function dateDaysAgo(days: number, hour = 12): Date {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(today - days * dayMs + hour * 60 * 60 * 1000);
}

function dateOnlyDaysAgo(days: number): Date {
  return dateDaysAgo(days, 0);
}

async function clearDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.paymentLink.deleteMany(),
    prisma.invoiceDocument.deleteMany(),
    prisma.invoiceLineItem.deleteMany(),
    prisma.invoiceNumberSequence.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.product.deleteMany(),
    prisma.client.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany()
  ]);
}

async function seed(): Promise<void> {
  if (process.env.SEED_CONFIRM !== "WIPE_AND_SEED") {
    throw new Error("Set SEED_CONFIRM=WIPE_AND_SEED to run the destructive local seed");
  }

  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD is required");
  }

  await clearDatabase();

  const organization = await prisma.organization.create({
    data: { name: "Northstar Digital", currency: "INR" }
  });
  const user = await prisma.user.create({
    data: {
      name: "Aarav Mehta",
      email: "admin@northstar.test",
      passwordHash: await hashPassword(password)
    }
  });
  await prisma.membership.create({
    data: { organizationId: organization.id, userId: user.id, role: Role.OWNER }
  });

  const memberData = [
    ["Riya Shah", "manager@northstar.test", Role.ADMIN],
    ["Kabir Nair", "finance@northstar.test", Role.ACCOUNTANT],
    ["Meera Iyer", "viewer@northstar.test", Role.VIEWER]
  ] as const;
  for (const [name, email, role] of memberData) {
    const member = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password)
      }
    });
    await prisma.membership.create({
      data: { organizationId: organization.id, userId: member.id, role }
    });
  }

  const clientData = [
    ["Luma Retail", "ops@luma-retail.test", "+919810001001"],
    ["Aster Health", "finance@asterhealth.test", "+919810001002"],
    ["Vertex Finance", "accounts@vertex-finance.test", "+919810001003"],
    ["Bloom & Co.", "hello@bloomco.test", "+919810001004"],
    ["Kora Logistics", "payables@kora-logistics.test", "+919810001005"],
    ["Sierra Estates", "admin@sierra-estates.test", "+919810001006"]
  ] as const;
  const clients = [];
  for (const [name, email, phone] of clientData) {
    clients.push(
      await prisma.client.create({
        data: { organizationId: organization.id, name, email, phone }
      })
    );
  }

  const productData = [
    ["Product design sprint", "Strategy, UX flows, and a tested prototype", 180000],
    ["Cloud platform delivery", "Production cloud foundation and deployment", 320000],
    ["Managed IT support", "Monitoring, incidents, and monthly technical support", 90000],
    ["Data and AI enablement", "Data pipelines, dashboards, and practical AI workflows", 275000],
    ["Security readiness audit", "Infrastructure, access, and application security review", 210000],
    ["Custom software build", "End-to-end web and internal product engineering", 450000]
  ] as const;
  const products = [];
  for (const [name, description, unitPrice] of productData) {
    products.push(
      await prisma.product.create({
        data: {
          organizationId: organization.id,
          name,
          description,
          unitPrice,
          currency: "INR"
        }
      })
    );
  }

  const invoices: SeedInvoice[] = [
    {
      invoiceNumber: "INV-2026-0001",
      clientId: clients[0].id,
      status: InvoiceStatus.PAID,
      issueDaysAgo: 45,
      dueDaysFromIssue: 15,
      subtotal: 400000,
      taxTotal: 80000,
      total: 480000,
      amountPaid: 480000,
      productId: products[1].id,
      description: "Cloud platform delivery",
      notes: "Production workspace and deployment support included.",
      terms: "Payment due within 15 days.",
      paidDaysAgo: 42,
      paymentMethod: "upi"
    },
    {
      invoiceNumber: "INV-2026-0002",
      clientId: clients[1].id,
      status: InvoiceStatus.PAID,
      issueDaysAgo: 32,
      dueDaysFromIssue: 15,
      subtotal: 280000,
      taxTotal: 40000,
      total: 320000,
      amountPaid: 320000,
      productId: products[0].id,
      description: "Product design sprint",
      notes: "Customer portal discovery and prototype.",
      terms: "Payment due within 15 days.",
      paidDaysAgo: 30,
      paymentMethod: "netbanking"
    },
    {
      invoiceNumber: "INV-2026-0003",
      clientId: clients[2].id,
      status: InvoiceStatus.PARTIALLY_PAID,
      issueDaysAgo: 25,
      dueDaysFromIssue: 15,
      subtotal: 590000,
      taxTotal: 60000,
      total: 650000,
      amountPaid: 250000,
      productId: products[5].id,
      description: "Custom software build",
      notes: "Phase one of the reporting workspace.",
      terms: "Partial payments accepted against this milestone.",
      paidDaysAgo: 22,
      paymentMethod: "upi"
    },
    {
      invoiceNumber: "INV-2026-0004",
      clientId: clients[3].id,
      status: InvoiceStatus.PAID,
      issueDaysAgo: 18,
      dueDaysFromIssue: 15,
      subtotal: 250000,
      taxTotal: 40000,
      total: 290000,
      amountPaid: 290000,
      productId: products[3].id,
      description: "Data and AI enablement",
      notes: "Executive reporting dashboard and data quality review.",
      terms: "Payment due within 15 days.",
      paidDaysAgo: 15,
      paymentMethod: "upi"
    },
    {
      invoiceNumber: "INV-2026-0005",
      clientId: clients[4].id,
      status: InvoiceStatus.PAID,
      issueDaysAgo: 14,
      dueDaysFromIssue: 15,
      subtotal: 360000,
      taxTotal: 50000,
      total: 410000,
      amountPaid: 410000,
      productId: products[2].id,
      description: "Managed IT support",
      notes: "Quarterly support and observability coverage.",
      terms: "Payment due within 15 days.",
      paidDaysAgo: 12,
      paymentMethod: "netbanking"
    },
    {
      invoiceNumber: "INV-2026-0006",
      clientId: clients[5].id,
      status: InvoiceStatus.PARTIALLY_PAID,
      issueDaysAgo: 10,
      dueDaysFromIssue: 15,
      subtotal: 330000,
      taxTotal: 30000,
      total: 360000,
      amountPaid: 120000,
      productId: products[4].id,
      description: "Security readiness audit",
      notes: "Initial audit and remediation plan delivered.",
      terms: "Partial payments accepted against this milestone.",
      paidDaysAgo: 8,
      paymentMethod: "upi"
    },
    {
      invoiceNumber: "INV-2026-0007",
      clientId: clients[0].id,
      status: InvoiceStatus.SENT,
      issueDaysAgo: 7,
      dueDaysFromIssue: 15,
      subtotal: 500000,
      taxTotal: 40000,
      total: 540000,
      amountPaid: 0,
      productId: products[1].id,
      description: "Cloud platform delivery",
      notes: "Migration plan and environment hardening.",
      terms: "Payment due within 15 days."
    },
    {
      invoiceNumber: "INV-2026-0008",
      clientId: clients[2].id,
      status: InvoiceStatus.OVERDUE,
      issueDaysAgo: 30,
      dueDaysFromIssue: 15,
      subtotal: 240000,
      taxTotal: 35000,
      total: 275000,
      amountPaid: 0,
      productId: products[4].id,
      description: "Security readiness audit",
      notes: "Annual security baseline review.",
      terms: "Payment due within 15 days."
    },
    {
      invoiceNumber: "INV-2026-0009",
      clientId: clients[3].id,
      status: InvoiceStatus.DRAFT,
      issueDaysAgo: 2,
      dueDaysFromIssue: 15,
      subtotal: 650000,
      taxTotal: 70000,
      total: 720000,
      amountPaid: 0,
      productId: products[5].id,
      description: "Custom software build",
      notes: "Discovery and delivery estimate for approval.",
      terms: "Draft estimate."
    },
    {
      invoiceNumber: "INV-2026-0010",
      clientId: clients[4].id,
      status: InvoiceStatus.CANCELLED,
      issueDaysAgo: 20,
      dueDaysFromIssue: 15,
      subtotal: 170000,
      taxTotal: 15000,
      total: 185000,
      amountPaid: 0,
      productId: products[0].id,
      description: "Product design sprint",
      notes: "Project paused by client.",
      terms: "Cancelled."
    },
    {
      invoiceNumber: "INV-2026-0011",
      clientId: clients[1].id,
      status: InvoiceStatus.PAID,
      issueDaysAgo: 1,
      dueDaysFromIssue: 15,
      subtotal: 280000,
      taxTotal: 30000,
      total: 310000,
      amountPaid: 310000,
      productId: products[3].id,
      description: "Data and AI enablement",
      notes: "Monthly operations dashboard delivery.",
      terms: "Payment due within 15 days.",
      paidDaysAgo: 1,
      paymentMethod: "upi"
    },
    {
      invoiceNumber: "INV-2026-0012",
      clientId: clients[5].id,
      status: InvoiceStatus.PARTIALLY_PAID,
      issueDaysAgo: 0,
      dueDaysFromIssue: 15,
      subtotal: 390000,
      taxTotal: 35000,
      total: 425000,
      amountPaid: 125000,
      productId: products[5].id,
      description: "Custom software build",
      notes: "First milestone received; remaining balance due on delivery.",
      terms: "Partial payments accepted against milestones.",
      paidDaysAgo: 0,
      paymentMethod: "upi"
    }
  ];

  for (const [index, input] of invoices.entries()) {
    const invoice = await prisma.invoice.create({
      data: {
        organizationId: organization.id,
        clientId: input.clientId,
        invoiceNumber: input.invoiceNumber,
        status: input.status,
        issueDate: dateOnlyDaysAgo(input.issueDaysAgo),
        dueDate: dateOnlyDaysAgo(input.issueDaysAgo - input.dueDaysFromIssue),
        currency: "INR",
        subtotal: input.subtotal,
        taxTotal: input.taxTotal,
        total: input.total,
        amountPaid: input.amountPaid,
        balanceDue: input.total - input.amountPaid,
        notes: input.notes,
        terms: input.terms,
        lineItems: {
          create: {
            productId: input.productId,
            description: input.description,
            quantity: 1,
            unitPrice: input.subtotal,
            taxRate: input.subtotal > 0 ? Math.round((input.taxTotal / input.subtotal) * 10000) : 0,
            lineTotal: input.subtotal,
            lineTax: input.taxTotal,
            sortOrder: 0
          }
        }
      }
    });

    if (input.paidDaysAgo !== undefined && input.amountPaid > 0) {
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          invoiceId: invoice.id,
          providerPaymentId: `pay_seed_${index + 1}`,
          webhookEventId: `evt_seed_${index + 1}`,
          amount: input.amountPaid,
          currency: "INR",
          status: PaymentStatus.CAPTURED,
          method: input.paymentMethod ?? "upi",
          paidAt: dateDaysAgo(input.paidDaysAgo),
          providerCreatedAt: dateDaysAgo(input.paidDaysAgo)
        }
      });
    }
  }

  process.stdout.write(
    `${JSON.stringify({
      organization: organization.name,
      user: "admin@northstar.test",
      members: memberData.length + 1,
      invoices: invoices.length,
      payments: invoices.filter((invoice) => invoice.amountPaid > 0).length
    })}\n`
  );
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
