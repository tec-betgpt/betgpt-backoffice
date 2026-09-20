import { describe, expect, it } from "vitest";
import { mapAnalyticsResponse } from "@/composables/useConsolidatedAnalytics";

describe("mapAnalyticsResponse", () => {
  it("maps every analytics period to a PeriodComponent entry", () => {
    const periods = mapAnalyticsResponse({
      users_period: [{ date: "2026-09-01", count: 3 }],
      player_logins_period: [{ date: "2026-09-01", value: 10 }],
      unique_player_logins_period: [
        { date: "2026-09-01", Logins: 5, Depositantes: 2 },
      ],
      unique_player_logins_moving_average_period: [
        { date: "2026-09-01", "7 Dias": 1, "14 Dias": 2, "28 Dias": 3 },
      ],
      login_to_deposit_conversion_rate_period: [
        { date: "2026-09-01", "% Conversão": 50 },
      ],
      login_to_deposit_conversion_rate_moving_average_period: [
        { date: "2026-09-01", "7 Dias": 10, "14 Dias": 20, "28 Dias": 30 },
      ],
      deposits_period: [{ date: "2026-09-01", total: 100 }],
      percent_net_deposits_period: [
        { date: "2026-09-01", "7 Dias %": 50, "14 Dias %": 40, "28 Dias %": 30 },
      ],
      net_deposits_period: [{ date: "2026-09-01", total: 80 }],
      active_users_period: [{ date: "2026-09-01", count: 7 }],
      percent_ftd_day_period: [{ date: "2026-09-01", "FTD/Dia": 25 }],
      value_net_deposits_period: [{ date: "2026-09-01", Entradas: 90 }],
      value_deposits_period: [{ date: "2026-09-01", Entradas: 120 }],
      value_withdraws_period: [{ date: "2026-09-01", Saídas: 10 }],
      registration_deposit_rate_period: [
        { date: "2026-09-01", "% Entrada": 60 },
      ],
      deposit_conversion_rate_period: [
        { date: "2026-09-01", "% Saída": 70 },
      ],
      meta: { users_period: "Glossário de usuários" },
    });

    expect(periods).toHaveLength(16);
    expect(periods[0].chartName).toBe("users");
    expect(periods[0].glossary).toBe("Glossário de usuários");
    expect(periods[15].chartName).toBe("dep_conv_rate");
  });

  it("divides percentage periods by 100", () => {
    const periods = mapAnalyticsResponse({
      percent_net_deposits_period: [
        { date: "2026-09-01", "7 Dias %": 50, "14 Dias %": 40, "28 Dias %": 30 },
      ],
      percent_ftd_day_period: [{ date: "2026-09-01", "FTD/Dia": 25 }],
      registration_deposit_rate_period: [{ date: "2026-09-01", "% Entrada": 60 }],
      deposit_conversion_rate_period: [{ date: "2026-09-01", "% Saída": 70 }],
    });

    const percentNet = periods.find((p) => p.chartName === "percent_net_deposits")!;
    const value = percentNet.period[0].value[0] as any;
    expect(value["7 Dias %"]).toBe(0.5);
    expect(value["14 Dias %"]).toBe(0.4);

    const ftd = periods.find((p) => p.chartName === "percent_ftd")!;
    expect((ftd.period[0].value[0] as any)["FTD/Dia"]).toBe(0.25);

    const reg = periods.find((p) => p.chartName === "reg_dep_rate")!;
    expect((reg.period[0].value[0] as any)["% Entrada"]).toBe(0.6);
  });

  it("tolerates a missing/partial payload", () => {
    const periods = mapAnalyticsResponse(undefined);
    expect(periods).toHaveLength(16);
    expect(periods[0].period[0].value).toEqual([]);
    expect(periods[1].glossary).toContain("Logins");
  });
});
