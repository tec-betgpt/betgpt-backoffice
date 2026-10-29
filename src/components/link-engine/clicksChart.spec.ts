import { describe, expect, it } from "vitest";
import {
  buildClicksByLinkSeries,
  getTooltipRows,
  UNATTRIBUTED_SERIES_NAME,
} from "@/components/link-engine/clicksChart";
import type { ClickMinutePoint } from "@/services/linkEngine";

function point(overrides: Partial<ClickMinutePoint>): ClickMinutePoint {
  return { minute: "2026-10-29T10:00:00-03:00", clicks: 0, ...overrides };
}

describe("buildClicksByLinkSeries", () => {
  it("retorna vazio quando não há pontos", () => {
    expect(buildClicksByLinkSeries([])).toEqual([]);
  });

  it("cria uma série por link usando o code como nome", () => {
    const series = buildClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 3,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 },
          { link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 1 },
        ],
      }),
    ]);

    expect(series.map((item) => item.name)).toEqual(["promo-x", "black-friday"]);
    expect(series[0].data).toEqual([{ x: new Date("2026-10-29T10:00:00-03:00").getTime(), y: 2 }]);
    expect(series[1].data).toEqual([{ x: new Date("2026-10-29T10:00:00-03:00").getTime(), y: 1 }]);
  });

  it("preenche com zero os minutos em que o link não apareceu", () => {
    const series = buildClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 2,
        by_link: [{ link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 }],
      }),
      point({
        minute: "2026-10-29T10:01:00-03:00",
        clicks: 1,
        by_link: [{ link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 1 }],
      }),
    ]);

    const promo = series.find((item) => item.name === "promo-x");
    const blackFriday = series.find((item) => item.name === "black-friday");

    expect(promo?.data.map((item) => item.y)).toEqual([2, 0]);
    expect(blackFriday?.data.map((item) => item.y)).toEqual([0, 1]);
  });

  it("ordena os pontos por minuto crescente", () => {
    const series = buildClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:01:00-03:00",
        clicks: 1,
        by_link: [{ link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 1 }],
      }),
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 2,
        by_link: [{ link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 }],
      }),
    ]);

    expect(series[0].data.map((item) => item.y)).toEqual([2, 1]);
  });

  it("mantém os cliques não atribuídos em uma série própria", () => {
    const series = buildClicksByLinkSeries([
      point({
        clicks: 5,
        by_link: [{ link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 3 }],
      }),
    ]);

    const unattributed = series.find((item) => item.name === UNATTRIBUTED_SERIES_NAME);
    expect(unattributed?.data[0].y).toBe(2);
  });

  it("getTooltipRows ignora séries com zero no minuto", () => {
    const rows = getTooltipRows({
      series: [
        [2, 5],
        [0, 3],
      ],
      seriesNames: ["promo-x", "black-friday"],
      colors: ["#111111", "#222222"],
      dataPointIndex: 0,
    });

    expect(rows).toEqual([{ name: "promo-x", color: "#111111", value: 2 }]);
  });

  it("getTooltipRows ordena do maior para o menor", () => {
    const rows = getTooltipRows({
      series: [[1], [4], [2]],
      seriesNames: ["a", "b", "c"],
      colors: ["#111111", "#222222", "#333333"],
      dataPointIndex: 0,
    });

    expect(rows.map((row) => row.name)).toEqual(["b", "c", "a"]);
  });

  it("getTooltipRows retorna vazio quando todas as séries são zero", () => {
    const rows = getTooltipRows({
      series: [[0], [0]],
      seriesNames: ["a", "b"],
      colors: ["#111111", "#222222"],
      dataPointIndex: 0,
    });

    expect(rows).toEqual([]);
  });

  it("usa o total quando o endpoint ainda não retorna by_link", () => {
    const series = buildClicksByLinkSeries([point({ clicks: 7 })]);

    expect(series).toHaveLength(1);
    expect(series[0].name).toBe("Cliques");
    expect(series[0].data[0].y).toBe(7);
  });
});
