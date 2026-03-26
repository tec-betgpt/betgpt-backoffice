export function getMs (num) {
  return (num / 10).toFixed(1) + "s";
}

export function formatMinifiedCurrency (value) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1000000000) {
    return `${sign}R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000000000)} bi`;
  }
  if (absValue >= 1000000) {
    return `${sign}R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000000)} mi`;
  }
  if (absValue >= 1000) {
    return `${sign}R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000)} mil`;
  }

  return `${sign}R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(absValue)}`;
}

export function formatMinifiedNumber (value) {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1000000000) {
    return `${sign}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000000000)} bi`;
  }
  if (absValue >= 1000000) {
    return `${sign}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000000)} mi`;
  }
  if (absValue >= 1000) {
    return `${sign}${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2, roundingMode: "trunc" }).format(absValue / 1000)} mil`;
  }

  return `${sign}${new Intl.NumberFormat("pt-BR").format(absValue)}`;
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
