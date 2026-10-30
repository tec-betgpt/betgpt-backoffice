import { describe, expect, it } from "vitest";
import {
  ALL_CLICKS_SERIES_NAME,
  buildClicksByLinkSeries,
  buildHourlyClicksByLinkSeries,
  getChartLinks,
  getLinkLastClicks,
  getTooltipRows,
  sumClicksSince,
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

  it("getLinkLastClicks retorna vazio sem pontos", () => {
    expect(getLinkLastClicks([])).toEqual({ lastClick: null, links: [] });
  });

  it("getLinkLastClicks agrega total e último clique por link", () => {
    const { lastClick, links } = getLinkLastClicks([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 3,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 },
          { link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 1 },
        ],
      }),
      point({
        minute: "2026-10-29T10:05:00-03:00",
        clicks: 4,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 4 },
        ],
      }),
    ]);

    expect(lastClick).toEqual(
      expect.objectContaining({
        linkId: 12,
        code: "promo-x",
        totalClicks: 6,
        lastClickAt: "2026-10-29T10:05:00-03:00",
        clicksAtLastClick: 4,
      }),
    );
    expect(links.map((link) => link.linkId)).toEqual([12, 34]);
    expect(links[1]).toEqual(
      expect.objectContaining({
        linkId: 34,
        totalClicks: 1,
        lastClickAt: "2026-10-29T10:00:00-03:00",
      }),
    );
  });

  it("getLinkLastClicks escolhe o link mais recente e ignora cliques zero", () => {
    const { lastClick, links } = getLinkLastClicks([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 2,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 },
        ],
      }),
      point({
        minute: "2026-10-29T10:07:00-03:00",
        clicks: 0,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 0 },
        ],
      }),
    ]);

    expect(links).toHaveLength(1);
    expect(lastClick?.lastClickAt).toBe("2026-10-29T10:00:00-03:00");
  });

  it("getLinkLastClicks desempata pelo volume no minuto mais recente", () => {
    const { lastClick } = getLinkLastClicks([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 5,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 },
          { link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 3 },
        ],
      }),
    ]);

    expect(lastClick?.linkId).toBe(34);
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

describe("buildHourlyClicksByLinkSeries", () => {
  const linkA = { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 1 };
  const linkB = { link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 1 };

  it("retorna vazio quando não há pontos", () => {
    expect(buildHourlyClicksByLinkSeries([])).toEqual([]);
  });

  it("agrega minutos do mesmo horário em um único ponto", () => {
    const series = buildHourlyClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 3,
        by_link: [{ ...linkA, clicks: 2 }, { ...linkB, clicks: 1 }],
      }),
      point({
        minute: "2026-10-29T10:45:00-03:00",
        clicks: 2,
        by_link: [{ ...linkA, clicks: 2 }],
      }),
    ]);

    const promo = series.find((item) => item.name === "promo-x");
    const blackFriday = series.find((item) => item.name === "black-friday");

    expect(promo?.data).toEqual([{ x: new Date("2026-10-29T10:00:00-03:00").getTime(), y: 4 }]);
    expect(blackFriday?.data).toEqual([{ x: new Date("2026-10-29T10:00:00-03:00").getTime(), y: 1 }]);
  });

  it("preenche com zero as horas sem cliques entre os extremos", () => {
    const series = buildHourlyClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 1,
        by_link: [linkA],
      }),
      point({
        minute: "2026-10-29T12:00:00-03:00",
        clicks: 2,
        by_link: [{ ...linkA, clicks: 2 }],
      }),
    ]);

    const promo = series.find((item) => item.name === "promo-x");
    expect(promo?.data.map((item) => item.y)).toEqual([1, 0, 2]);
  });

  it("cria a série Todos os envios como linha, escondida por padrão no legend", () => {
    const series = buildHourlyClicksByLinkSeries([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 3,
        by_link: [linkA],
      }),
    ]);

    const total = series.find((item) => item.name === ALL_CLICKS_SERIES_NAME);
    expect(total?.type).toBe("line");
    expect(total?.data[0].y).toBe(3);
    expect(series.filter((item) => item.name !== ALL_CLICKS_SERIES_NAME).every((item) => item.type === "area")).toBe(true);
  });

  it("soma apenas os links selecionados na série Todos os envios", () => {
    const series = buildHourlyClicksByLinkSeries(
      [
        point({
          minute: "2026-10-29T10:00:00-03:00",
          clicks: 5,
          by_link: [{ ...linkA, clicks: 3 }, { ...linkB, clicks: 2 }],
        }),
      ],
      { selectedLinkIds: new Set([12]) },
    );

    expect(series.map((item) => item.name)).toEqual(["promo-x", ALL_CLICKS_SERIES_NAME]);
    expect(series.find((item) => item.name === ALL_CLICKS_SERIES_NAME)?.data[0].y).toBe(3);
  });

  it("retorna vazio quando nenhum link está selecionado", () => {
    const series = buildHourlyClicksByLinkSeries(
      [
        point({
          minute: "2026-10-29T10:00:00-03:00",
          clicks: 3,
          by_link: [linkA],
        }),
      ],
      { selectedLinkIds: new Set() },
    );

    expect(series).toEqual([]);
  });

  it("usa uma série única quando o endpoint não retorna by_link", () => {
    const series = buildHourlyClicksByLinkSeries([point({ clicks: 7 })]);

    expect(series).toHaveLength(1);
    expect(series[0].name).toBe("Cliques");
    expect(series[0].type).toBe("area");
    expect(series[0].data[0].y).toBe(7);
  });
});

describe("getChartLinks", () => {
  it("lista os links pelo total de cliques, do maior para o menor", () => {
    const links = getChartLinks([
      point({
        minute: "2026-10-29T10:00:00-03:00",
        clicks: 4,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 1 },
          { link_id: 34, code: "black-friday", short_url: "https://le.example.com/black-friday", clicks: 3 },
        ],
      }),
      point({
        minute: "2026-10-29T10:01:00-03:00",
        clicks: 2,
        by_link: [
          { link_id: 12, code: "promo-x", short_url: "https://le.example.com/promo-x", clicks: 2 },
        ],
      }),
    ]);

    expect(links).toEqual([
      { id: 34, name: "black-friday", total: 3, shortUrl: "https://le.example.com/black-friday" },
      { id: 12, name: "promo-x", total: 3, shortUrl: "https://le.example.com/promo-x" },
    ]);
  });
});

describe("sumClicksSince", () => {
  it("soma somente os pontos dentro da janela", () => {
    const since = new Date("2026-10-29T10:00:00-03:00").getTime();
    const total = sumClicksSince(
      [
        point({ minute: "2026-10-29T09:59:00-03:00", clicks: 9 }),
        point({ minute: "2026-10-29T10:00:00-03:00", clicks: 2 }),
        point({ minute: "2026-10-29T10:30:00-03:00", clicks: 3 }),
      ],
      since,
    );

    expect(total).toBe(5);
  });
});
