export function formatLargeNumber(value) {
  const formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const number = Number.parseFloat(value)

  // trilhões
  if (number >= 1000000000000) {
    const formatted = formatter.format(number)
    return {
      content: formatted,
      separator: 'tri.'
    }
  }

  // bilhões
  if (number >= 1_000_000_000) {
    const formatted = formatter.format(number)
    return {
      content: formatted,
      separator: 'bi.'
    }
  }

  // milhões
  if (number >= 1_000_000) {
    const numberInMillions = Math.floor(number / 1000)

    const formatted = formatter.format(numberInMillions)
    return {
      content: formatted,
      separator: 'mi.'
    }
  }

  // mil
  if (number >= 100000) {
    return {
      content: formatter.format(number),
      separator: 'mil'
    }
  }

  return {
    content: formatter.format(number),
    separator: ''
  }
}
