export function toCurrency(value, currency = "BRL", locale = "pt-BR") {
  if (typeof value !== "number") {
    return value;
  }
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  });
  return formatter.format(value);
}
