export interface DailyClickPoint {
  date: string;
  clicks: number;
}

export interface WeeklyCumulativeClickPoint {
  date: string;
  label: string;
  clicks: number;
  cumulative: number;
  isToday: boolean;
}

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildWeeklyCumulativeClicks(
  dailyPoints: DailyClickPoint[],
  today = new Date(),
): WeeklyCumulativeClickPoint[] {
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const sunday = new Date(todayStart);
  sunday.setDate(sunday.getDate() - sunday.getDay());

  const clicksByDate = new Map(
    dailyPoints.map((point) => [point.date, Number(point.clicks) || 0]),
  );
  const todayKey = formatDateKey(todayStart);

  let cumulative = 0;

  return WEEK_LABELS.map((label, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    const dateKey = formatDateKey(date);
    const clicks = clicksByDate.get(dateKey) ?? 0;
    cumulative += clicks;

    return {
      date: dateKey,
      label,
      clicks,
      cumulative,
      isToday: dateKey === todayKey,
    };
  });
}
