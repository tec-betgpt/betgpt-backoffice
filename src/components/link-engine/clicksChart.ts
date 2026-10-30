import type { ClickMinuteLinkClicks, ClickMinutePoint } from "@/services/linkEngine";

export const UNATTRIBUTED_SERIES_NAME = "Não identificado";
export const TOTAL_SERIES_NAME = "Cliques";

export interface ClicksChartPoint {
  x: number;
  y: number;
}

export interface ClicksChartSeries {
  name: string;
  data: ClicksChartPoint[];
}

export interface ClicksTooltipRow {
  name: string;
  color: string;
  value: number;
}

export interface LinkLastClick {
  linkId: number;
  code: string;
  shortUrl: string;
  totalClicks: number;
  lastClickAt: string;
  clicksAtLastClick: number;
}

export interface LinkLastClicksOverview {
  lastClick: LinkLastClick | null;
  links: LinkLastClick[];
}

interface TooltipRowsParams {
  series: number[][];
  seriesNames: string[];
  colors: string[];
  dataPointIndex: number;
}

interface NormalizedMinute {
  time: number;
  clicks: number;
  byLink: Map<number, number>;
}

export function sortClickMinutePoints(points: ClickMinutePoint[]): ClickMinutePoint[] {
  return [...points].sort(
    (left, right) => new Date(left.minute).getTime() - new Date(right.minute).getTime(),
  );
}

function normalizePoints(points: ClickMinutePoint[]): NormalizedMinute[] {
  return sortClickMinutePoints(points).map((point) => {
    const byLink = new Map<number, number>();
    (point.by_link ?? []).forEach((link) => {
      const clicks = Number(link.clicks) || 0;
      byLink.set(link.link_id, (byLink.get(link.link_id) ?? 0) + clicks);
    });

    return {
      time: new Date(point.minute).getTime(),
      clicks: Number(point.clicks) || 0,
      byLink,
    };
  });
}

export function getLinkLastClicks(points: ClickMinutePoint[]): LinkLastClicksOverview {
  const links = new Map<number, LinkLastClick>();

  sortClickMinutePoints(points).forEach((point) => {
    const minuteClicks = new Map<number, { clicks: number; link: ClickMinuteLinkClicks }>();

    (point.by_link ?? []).forEach((link) => {
      const clicks = Number(link.clicks) || 0;
      if (clicks <= 0) return;

      const current = minuteClicks.get(link.link_id);
      if (current) {
        current.clicks += clicks;
      } else {
        minuteClicks.set(link.link_id, { clicks, link });
      }
    });

    minuteClicks.forEach(({ clicks, link }) => {
      const previous = links.get(link.link_id);

      links.set(link.link_id, {
        linkId: link.link_id,
        code: link.code || `#${link.link_id}`,
        shortUrl: link.short_url || "",
        totalClicks: (previous?.totalClicks ?? 0) + clicks,
        lastClickAt: point.minute,
        clicksAtLastClick: clicks,
      });
    });
  });

  const sortedLinks = [...links.values()].sort((left, right) => {
    const timeDiff = new Date(right.lastClickAt).getTime() - new Date(left.lastClickAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    if (right.clicksAtLastClick !== left.clicksAtLastClick) {
      return right.clicksAtLastClick - left.clicksAtLastClick;
    }
    return left.code.localeCompare(right.code);
  });

  return {
    lastClick: sortedLinks[0] ?? null,
    links: sortedLinks,
  };
}

export function getTooltipRows({
  series,
  seriesNames,
  colors,
  dataPointIndex,
}: TooltipRowsParams): ClicksTooltipRow[] {
  return series
    .map((values, index) => ({
      name: seriesNames[index] ?? `Série ${index + 1}`,
      color: colors[index] ?? "currentColor",
      value: Number(values?.[dataPointIndex]) || 0,
    }))
    .filter((row) => row.value > 0)
    .sort((left, right) => right.value - left.value);
}

export function buildClicksByLinkSeries(points: ClickMinutePoint[]): ClicksChartSeries[] {
  const minutes = normalizePoints(points);
  if (minutes.length === 0) return [];

  const linkNames = new Map<number, string>();
  points.forEach((point) => {
    (point.by_link ?? []).forEach((link) => {
      if (!linkNames.has(link.link_id)) {
        linkNames.set(link.link_id, link.code || `#${link.link_id}`);
      }
    });
  });

  if (linkNames.size === 0) {
    return [
      {
        name: TOTAL_SERIES_NAME,
        data: minutes.map((minute) => ({ x: minute.time, y: minute.clicks })),
      },
    ];
  }

  const series = [...linkNames.entries()]
    .map(([linkId, name]) => ({
      linkId,
      name,
      total: minutes.reduce((sum, minute) => sum + (minute.byLink.get(linkId) ?? 0), 0),
    }))
    .sort((left, right) => right.total - left.total)
    .map(({ linkId, name }) => ({
      name,
      data: minutes.map((minute) => ({
        x: minute.time,
        y: minute.byLink.get(linkId) ?? 0,
      })),
    }));

  const unattributed = minutes.map((minute) => {
    const attributed = [...minute.byLink.values()].reduce((sum, clicks) => sum + clicks, 0);
    return { x: minute.time, y: Math.max(minute.clicks - attributed, 0) };
  });

  if (unattributed.some((point) => point.y > 0)) {
    series.push({ name: UNATTRIBUTED_SERIES_NAME, data: unattributed });
  }

  return series;
}
