import { describe, expect, it } from "vitest";
import {
  buildWeeklyCumulativeClicks,
} from "@/components/link-engine/historyChart";

describe("buildWeeklyCumulativeClicks", () => {
  it("monta domingo a sábado da semana atual com acumulado", () => {
    const weekly = buildWeeklyCumulativeClicks(
      [
        { date: "2026-10-31", clicks: 9 },
        { date: "2026-11-01", clicks: 2 },
        { date: "2026-11-03", clicks: 5 },
        { date: "2026-11-08", clicks: 7 },
      ],
      new Date("2026-11-04T10:00:00"),
    );

    expect(weekly.map((item) => item.label)).toEqual([
      "Dom",
      "Seg",
      "Ter",
      "Qua",
      "Qui",
      "Sex",
      "Sáb",
    ]);
    expect(weekly.map((item) => item.date)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);
    expect(weekly.map((item) => item.clicks)).toEqual([2, 0, 5, 0, 0, 0, 0]);
    expect(weekly.map((item) => item.cumulative)).toEqual([2, 2, 7, 7, 7, 7, 7]);
    expect(weekly.map((item) => item.isToday)).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("zera os dias futuros quando ainda não há dados", () => {
    const weekly = buildWeeklyCumulativeClicks(
      [{ date: "2026-11-01", clicks: 3 }],
      new Date("2026-11-01T08:00:00"),
    );

    expect(weekly.map((item) => item.clicks)).toEqual([3, 0, 0, 0, 0, 0, 0]);
    expect(weekly.map((item) => item.cumulative)).toEqual([3, 3, 3, 3, 3, 3, 3]);
  });
});
