import type { ClickMinutePoint } from "@/services/linkEngine";

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

interface NormalizedMinute {
  time: number;
  clicks: number;
  byLink: Map<number, number>;
}

function normalizePoints(points: ClickMinutePoint[]): NormalizedMinute[] {
  return [...points]
    .sort((left, right) => new Date(left.minute).getTime() - new Date(right.minute).getTime())
    .map((point) => {
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
