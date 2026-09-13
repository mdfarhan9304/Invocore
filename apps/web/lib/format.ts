export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function formatTaxRate(basisPoints: number): string {
  if (basisPoints === 0) {
    return "—";
  }

  return `${(basisPoints / 100).toFixed(2)}%`;
}
