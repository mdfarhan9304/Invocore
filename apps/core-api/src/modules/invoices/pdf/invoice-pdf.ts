import React from "react";
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

export type PdfInvoiceData = {
  invoiceNumber: string | null;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  terms: string | null;
  organizationName: string;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
    lineTax: number;
  }>;
};

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatTaxRate(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

const colors = {
  primary: "#1e293b",
  secondary: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff"
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.primary
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: colors.primary
  },
  headerMeta: {
    alignItems: "flex-end"
  },
  headerLabel: {
    fontSize: 9,
    color: colors.secondary,
    marginBottom: 2
  },
  headerValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6
  },

  billingRow: {
    flexDirection: "row",
    gap: 40,
    marginBottom: 28
  },
  billingBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.bg,
    borderRadius: 4
  },
  billingTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.secondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6
  },
  billingName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3
  },
  billingDetail: {
    fontSize: 10,
    color: colors.secondary,
    marginBottom: 2
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    color: colors.white,
    padding: 8,
    borderRadius: 4,
    marginBottom: 2
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.white
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  colDescription: { width: "35%" },
  colQty: { width: "10%", textAlign: "right" as const },
  colPrice: { width: "18%", textAlign: "right" as const },
  colTax: { width: "12%", textAlign: "right" as const },
  colLineTotal: { width: "25%", textAlign: "right" as const },

  totalsContainer: {
    marginTop: 16,
    alignItems: "flex-end"
  },
  totalsBox: {
    width: 220,
    padding: 12,
    backgroundColor: colors.bg,
    borderRadius: 4
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  totalsLabel: {
    fontSize: 10,
    color: colors.secondary
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold"
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: 6
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold"
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold"
  },

  notesSection: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.secondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 4
  },
  notesText: {
    fontSize: 10,
    color: colors.secondary,
    lineHeight: 1.5
  },

  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 8,
    color: colors.secondary
  }
});

function InvoicePdfDocument(props: { data: PdfInvoiceData }) {
  const { data } = props;
  const c = data.currency;

  const headerEl = React.createElement(
    View,
    { style: styles.header },
    React.createElement(
      View,
      null,
      React.createElement(Text, { style: styles.title }, "INVOICE"),
      React.createElement(
        Text,
        { style: { fontSize: 11, marginTop: 4, color: colors.secondary } },
        data.organizationName
      )
    ),
    React.createElement(
      View,
      { style: styles.headerMeta },
      React.createElement(Text, { style: styles.headerLabel }, "Invoice Number"),
      React.createElement(Text, { style: styles.headerValue }, data.invoiceNumber ?? "DRAFT"),
      React.createElement(Text, { style: styles.headerLabel }, "Issue Date"),
      React.createElement(Text, { style: styles.headerValue }, data.issueDate ?? "—"),
      React.createElement(Text, { style: styles.headerLabel }, "Due Date"),
      React.createElement(Text, { style: styles.headerValue }, data.dueDate ?? "—")
    )
  );

  const billingEl = React.createElement(
    View,
    { style: styles.billingRow },
    React.createElement(
      View,
      { style: styles.billingBox },
      React.createElement(Text, { style: styles.billingTitle }, "From"),
      React.createElement(Text, { style: styles.billingName }, data.organizationName)
    ),
    React.createElement(
      View,
      { style: styles.billingBox },
      React.createElement(Text, { style: styles.billingTitle }, "Bill To"),
      React.createElement(Text, { style: styles.billingName }, data.clientName),
      data.clientEmail
        ? React.createElement(Text, { style: styles.billingDetail }, data.clientEmail)
        : null,
      data.clientAddress
        ? React.createElement(Text, { style: styles.billingDetail }, data.clientAddress)
        : null
    )
  );

  const tableHeaderEl = React.createElement(
    View,
    { style: styles.tableHeader },
    React.createElement(
      Text,
      { style: { ...styles.tableHeaderText, ...styles.colDescription } },
      "Description"
    ),
    React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colQty } }, "Qty"),
    React.createElement(
      Text,
      { style: { ...styles.tableHeaderText, ...styles.colPrice } },
      "Unit Price"
    ),
    React.createElement(Text, { style: { ...styles.tableHeaderText, ...styles.colTax } }, "Tax"),
    React.createElement(
      Text,
      { style: { ...styles.tableHeaderText, ...styles.colLineTotal } },
      "Total"
    )
  );

  const tableRowEls = data.lineItems.map((item, index) =>
    React.createElement(
      View,
      { style: styles.tableRow, key: String(index) },
      React.createElement(Text, { style: styles.colDescription }, item.description),
      React.createElement(Text, { style: styles.colQty }, String(item.quantity)),
      React.createElement(Text, { style: styles.colPrice }, formatMoney(item.unitPrice, c)),
      React.createElement(Text, { style: styles.colTax }, formatTaxRate(item.taxRate)),
      React.createElement(
        Text,
        { style: { ...styles.colLineTotal, fontFamily: "Helvetica-Bold" } },
        formatMoney(item.lineTotal + item.lineTax, c)
      )
    )
  );

  const totalsEl = React.createElement(
    View,
    { style: styles.totalsContainer },
    React.createElement(
      View,
      { style: styles.totalsBox },
      React.createElement(
        View,
        { style: styles.totalsRow },
        React.createElement(Text, { style: styles.totalsLabel }, "Subtotal"),
        React.createElement(Text, { style: styles.totalsValue }, formatMoney(data.subtotal, c))
      ),
      React.createElement(
        View,
        { style: styles.totalsRow },
        React.createElement(Text, { style: styles.totalsLabel }, "Tax"),
        React.createElement(Text, { style: styles.totalsValue }, formatMoney(data.taxTotal, c))
      ),
      React.createElement(View, { style: styles.totalsDivider }),
      React.createElement(
        View,
        { style: styles.totalsRow },
        React.createElement(Text, { style: styles.grandTotalLabel }, "Total"),
        React.createElement(Text, { style: styles.grandTotalValue }, formatMoney(data.total, c))
      ),
      data.amountPaid > 0
        ? React.createElement(
            View,
            null,
            React.createElement(
              View,
              { style: styles.totalsRow },
              React.createElement(Text, { style: styles.totalsLabel }, "Amount Paid"),
              React.createElement(
                Text,
                { style: styles.totalsValue },
                formatMoney(data.amountPaid, c)
              )
            ),
            React.createElement(
              View,
              { style: styles.totalsRow },
              React.createElement(Text, { style: styles.grandTotalLabel }, "Balance Due"),
              React.createElement(
                Text,
                { style: styles.grandTotalValue },
                formatMoney(data.balanceDue, c)
              )
            )
          )
        : null
    )
  );

  const notesEls: React.ReactElement[] = [];
  if (data.notes) {
    notesEls.push(
      React.createElement(
        View,
        { style: styles.notesSection, key: "notes" },
        React.createElement(Text, { style: styles.notesTitle }, "Notes"),
        React.createElement(Text, { style: styles.notesText }, data.notes)
      )
    );
  }
  if (data.terms) {
    notesEls.push(
      React.createElement(
        View,
        { style: data.notes ? { marginTop: 12 } : styles.notesSection, key: "terms" },
        React.createElement(Text, { style: styles.notesTitle }, "Terms & Conditions"),
        React.createElement(Text, { style: styles.notesText }, data.terms)
      )
    );
  }

  const footerEl = React.createElement(
    Text,
    { style: styles.footer },
    `Generated by ${data.organizationName} • ${data.invoiceNumber ?? "Draft"}`
  );

  const pageContent = React.createElement(
    Page,
    { size: "A4", style: styles.page },
    headerEl,
    billingEl,
    tableHeaderEl,
    ...tableRowEls,
    totalsEl,
    ...notesEls,
    footerEl
  );

  return React.createElement(
    Document,
    {
      title: `Invoice ${data.invoiceNumber ?? "Draft"}`,
      author: data.organizationName
    },
    pageContent
  );
}

export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const element = React.createElement(InvoicePdfDocument, {
    data
  }) as React.ReactElement<DocumentProps>;

  return renderToBuffer(element);
}
