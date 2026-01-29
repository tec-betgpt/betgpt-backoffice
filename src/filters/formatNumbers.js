export function getMs (num) {
  return (num / 10).toFixed(1) + "s";
}

export function formatMinifiedNumber (value) {
  if (value >= 1000000000) {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2,roundingMode: "trunc" }).format(value / 1000000000)} bi`;
  }
  if (value >= 1000000) {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2,roundingMode: "trunc"}).format(value / 1000000)} mi`;
  }
  if (value >= 1000) {
    return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2,roundingMode: "trunc" }).format(value / 1000)} mil`;
  }

  return new Intl.NumberFormat("pt-BR").format(value);
}

export function numberLocale (value, locale = "pt-BR") {
  return new Intl.NumberFormat(locale).format(value);
}

export function fractionDigits (value, digits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

export function secondsToTime (seconds) {
  if (!seconds) return "0s";

  const duration = {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: Math.floor(seconds % 60),
  };

  if (duration.hours > 0) {
    return `${duration.hours}h ${duration.minutes}min ${duration.seconds}s`;
  } else if (duration.minutes > 0) {
    return `${duration.minutes}min ${duration.seconds}s`;
  } else {
    return `${duration.seconds}s`;
  }
}

export function formatPercentage (value) {
  return `${(value || 0).toFixed(2)}%`;
}
