import type { ClickMinuteLinkClicks, ClickMinutePoint } from "@/services/linkEngine";

export const UNATTRIBUTED_SERIES_NAME = "Não identificado";
export const TOTAL_SERIES_NAME = "Cliques";
export const ALL_CLICKS_SERIES_NAME = "Todos os envios";

export interface ClicksChartPoint {
  x: number;
  y: number;
}

export interface ClicksChartSeries {
  name: string;
  type?: "area" | "line";
  data: ClicksChartPoint[];
}

export interface ChartLinkOption {
  id: number;
  name: string;
  total: number;
  shortUrl: string;
}

export interface HourlyClicksSeriesOptions {
  selectedLinkIds?: Set<number> | null;
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

const HOUR_MS = 60 * 60 * 1000;

interface NormalizedHour {
  time: number;
  clicks: number;
  byLink: Map<number, number>;
}

function getHourStart(time: number): number {
  const date = new Date(time);
  date.setMinutes(0, 0, 0);
  return date.getTime();
}

function normalizeHours(points: ClickMinutePoint[]): NormalizedHour[] {
  const hours = new Map<number, NormalizedHour>();

  sortClickMinutePoints(points).forEach((point) => {
    const time = getHourStart(new Date(point.minute).getTime());
    if (!Number.isFinite(time)) return;

    let hour = hours.get(time);
    if (!hour) {
      hour = { time, clicks: 0, byLink: new Map<number, number>() };
      hours.set(time, hour);
    }

    hour.clicks += Number(point.clicks) || 0;
    (point.by_link ?? []).forEach((link) => {
      hour!.byLink.set(
        link.link_id,
        (hour!.byLink.get(link.link_id) ?? 0) + (Number(link.clicks) || 0),
      );
    });
  });

  if (hours.size === 0) return [];

  const sortedTimes = [...hours.keys()].sort((left, right) => left - right);
  const first = sortedTimes[0];
  const last = sortedTimes[sortedTimes.length - 1];
  const filled: NormalizedHour[] = [];

  for (let time = first; time <= last; time += HOUR_MS) {
    filled.push(hours.get(time) ?? { time, clicks: 0, byLink: new Map() });
  }

  return filled;
}

export function getChartLinks(points: ClickMinutePoint[]): ChartLinkOption[] {
  const links = new Map<number, ChartLinkOption>();

  points.forEach((point) => {
    (point.by_link ?? []).forEach((link) => {
      const current = links.get(link.link_id);
      const clicks = Number(link.clicks) || 0;

      if (current) {
        current.total += clicks;
        return;
      }

      links.set(link.link_id, {
        id: link.link_id,
        name: link.code || `#${link.link_id}`,
        total: clicks,
        shortUrl: link.short_url || "",
      });
    });
  });

  return [...links.values()].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    return left.name.localeCompare(right.name);
  });
}

export function buildHourlyClicksByLinkSeries(
  points: ClickMinutePoint[],
  options: HourlyClicksSeriesOptions = {},
): ClicksChartSeries[] {
  const hours = normalizeHours(points);
  if (hours.length === 0) return [];

  const allLinkIds = new Set<number>();
  const linkNames = new Map<number, string>();

  points.forEach((point) => {
    (point.by_link ?? []).forEach((link) => {
      allLinkIds.add(link.link_id);
      if (!linkNames.has(link.link_id)) {
        linkNames.set(link.link_id, link.code || `#${link.link_id}`);
      }
    });
  });

  if (allLinkIds.size === 0) {
    return [
      {
        name: TOTAL_SERIES_NAME,
        type: "area",
        data: hours.map((hour) => ({ x: hour.time, y: hour.clicks })),
      },
    ];
  }

  const hasSelection =
    options.selectedLinkIds !== undefined && options.selectedLinkIds !== null;
  const selectedIds = hasSelection
    ? options.selectedLinkIds!
    : new Set(allLinkIds);

  if (selectedIds.size === 0) return [];

  const series = [...linkNames.entries()]
    .filter(([linkId]) => selectedIds.has(linkId))
    .map(([linkId, name]) => ({
      linkId,
      name,
      total: hours.reduce((sum, hour) => sum + (hour.byLink.get(linkId) ?? 0), 0),
    }))
    .sort((left, right) => {
      if (right.total !== left.total) return right.total - left.total;
      return left.name.localeCompare(right.name);
    })
    .map<ClicksChartSeries>(({ linkId, name }) => ({
      name,
      type: "area",
      data: hours.map((hour) => ({
        x: hour.time,
        y: hour.byLink.get(linkId) ?? 0,
      })),
    }));

  const allSelected = selectedIds.size === allLinkIds.size;

  if (!hasSelection || allSelected) {
    const unattributed = hours.map((hour) => {
      const attributed = [...hour.byLink.values()].reduce(
        (sum, clicks) => sum + clicks,
        0,
      );
      return { x: hour.time, y: Math.max(hour.clicks - attributed, 0) };
    });

    if (unattributed.some((point) => point.y > 0)) {
      series.push({ name: UNATTRIBUTED_SERIES_NAME, type: "area", data: unattributed });
    }
  }

  const total = hours.map((hour) => ({
    x: hour.time,
    y: hasSelection && !allSelected
      ? [...selectedIds].reduce(
          (sum, linkId) => sum + (hour.byLink.get(linkId) ?? 0),
          0,
        )
      : hour.clicks,
  }));

  series.push({ name: ALL_CLICKS_SERIES_NAME, type: "line", data: total });

  return series;
}

export function sumClicksSince(points: ClickMinutePoint[], since: number): number {
  return points.reduce((total, point) => {
    const time = new Date(point.minute).getTime();
    if (!Number.isFinite(time) || time < since) return total;
    return total + (Number(point.clicks) || 0);
  }, 0);
}
