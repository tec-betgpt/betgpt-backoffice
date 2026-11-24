export const PAID_INVOICE_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
export const UNPAID_INVOICE_STATUSES = ["PENDING", "OVERDUE"];

export const DUE_NOTICE_WINDOW_DAYS = 7;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export type InvoiceStatusTone = "amber" | "red" | "green" | "muted";

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatusTone, string> = {
  amber: "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400",
  red: "border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400",
  green: "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

export function isInvoicePaid(status?: string | null): boolean {
  return PAID_INVOICE_STATUSES.includes(status ?? "");
}

export function isInvoiceOverdue(
  invoice: { status?: string | null; due_at?: string | null },
  now: Date = new Date(),
): boolean {
  if (!UNPAID_INVOICE_STATUSES.includes(invoice.status ?? "")) return false;
  if (invoice.status === "OVERDUE") return true;

  return !!invoice.due_at && new Date(invoice.due_at).getTime() <= now.getTime();
}

export function invoiceStatusInfo(
  invoice: { status?: string | null; due_at?: string | null },
  now: Date = new Date(),
): { label: string; tone: InvoiceStatusTone } {
  if (isInvoicePaid(invoice.status)) return { label: "Paga", tone: "green" };
  if (isInvoiceOverdue(invoice, now)) return { label: "Vencida", tone: "red" };
  if (invoice.status === "PENDING") return { label: "Pendente", tone: "amber" };

  return { label: invoice.status || "-", tone: "muted" };
}

const plural = (value: number, singular: string, pluralForm: string) =>
  `${value} ${value === 1 ? singular : pluralForm}`;

/** Duração no formato do aviso: "2 dias 4 horas", "5 horas 12 minutos", "8 minutos". */
export function formatDueDistance(ms: number): string {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / DAY);
  const hours = Math.floor((abs % DAY) / HOUR);
  const minutes = Math.floor((abs % HOUR) / 60000);

  if (days > 0) {
    return hours > 0
      ? `${plural(days, "dia", "dias")} ${plural(hours, "hora", "horas")}`
      : plural(days, "dia", "dias");
  }

  if (hours > 0) {
    return minutes > 0
      ? `${plural(hours, "hora", "horas")} ${plural(minutes, "minuto", "minutos")}`
      : plural(hours, "hora", "horas");
  }

  return plural(Math.max(minutes, 1), "minuto", "minutos");
}

/** Estado do aviso da Home: null quando o vencimento ainda está fora da janela. */
export function dueNoticeState(
  dueAt: string | null | undefined,
  now: Date = new Date(),
  windowDays = DUE_NOTICE_WINDOW_DAYS,
): { overdue: boolean; distance: string } | null {
  if (!dueAt) return null;

  const diff = new Date(dueAt).getTime() - now.getTime();
  if (Number.isNaN(diff) || diff > windowDays * DAY) return null;

  return { overdue: diff <= 0, distance: formatDueDistance(diff) };
}
