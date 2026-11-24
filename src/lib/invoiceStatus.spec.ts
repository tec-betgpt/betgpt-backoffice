import { describe, expect, it } from "vitest";
import {
  dueNoticeState,
  formatDueDistance,
  invoiceStatusInfo,
} from "@/lib/invoiceStatus";

const NOW = new Date("2026-11-24T15:00:00-03:00");

describe("formatDueDistance", () => {
  it("mostra dias e horas, horas e minutos ou só minutos", () => {
    expect(formatDueDistance((2 * 24 + 4) * 3600_000)).toBe("2 dias 4 horas");
    expect(formatDueDistance(24 * 3600_000)).toBe("1 dia");
    expect(formatDueDistance((5 * 60 + 12) * 60_000)).toBe("5 horas 12 minutos");
    expect(formatDueDistance(60 * 60_000)).toBe("1 hora");
    expect(formatDueDistance(8 * 60_000)).toBe("8 minutos");
    expect(formatDueDistance(10_000)).toBe("1 minuto");
  });

  it("usa o valor absoluto para vencimentos passados", () => {
    expect(formatDueDistance(-(3 * 24 + 1) * 3600_000)).toBe("3 dias 1 hora");
  });
});

describe("dueNoticeState", () => {
  it("aparece dentro da janela de 7 dias", () => {
    expect(dueNoticeState("2026-11-26T19:00:00-03:00", NOW)).toEqual({
      overdue: false,
      distance: "2 dias 4 horas",
    });
  });

  it("aparece como vencido depois do vencimento", () => {
    expect(dueNoticeState("2026-11-20T00:00:00-03:00", NOW)).toEqual({
      overdue: true,
      distance: "4 dias 15 horas",
    });
  });

  it("fica oculto fora da janela ou sem data", () => {
    expect(dueNoticeState("2026-12-02T00:00:00-03:00", NOW)).toBeNull();
    expect(dueNoticeState(null, NOW)).toBeNull();
    expect(dueNoticeState("data inválida", NOW)).toBeNull();
  });
});

describe("invoiceStatusInfo", () => {
  it("traduz status do Asaas", () => {
    expect(invoiceStatusInfo({ status: "RECEIVED" }, NOW)).toEqual({ label: "Paga", tone: "green" });
    expect(invoiceStatusInfo({ status: "CONFIRMED" }, NOW).label).toBe("Paga");
    expect(invoiceStatusInfo({ status: "OVERDUE" }, NOW)).toEqual({ label: "Vencida", tone: "red" });
    expect(invoiceStatusInfo({ status: "REFUNDED" }, NOW)).toEqual({ label: "REFUNDED", tone: "muted" });
  });

  it("considera vencida a fatura pendente com vencimento passado", () => {
    expect(invoiceStatusInfo({ status: "PENDING", due_at: "2026-11-25T00:00:00-03:00" }, NOW)).toEqual({
      label: "Pendente",
      tone: "amber",
    });
    expect(invoiceStatusInfo({ status: "PENDING", due_at: "2026-11-24T00:00:00-03:00" }, NOW).label).toBe("Vencida");
  });
});
