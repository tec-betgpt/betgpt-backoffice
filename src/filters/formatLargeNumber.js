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
  if (number >= 1000000000) {
    const formatted = formatter.format( Math.floor(number / 1000))
    return {
      content: formatted,
      separator: 'kkk'
    }
  }

  // milhões
  if (number >= 1000000) {
    const numberInMillions = Math.floor(number / 1000)

    const formatted = formatter.format(numberInMillions)
    return {
      content: formatted,
      separator: 'kk'
    }
  }

  // mil
  if (number >= 1000) {
    return {
      content: formatter.format(Math.floor(number / 1000)),
      separator: 'k'
    }
  }

  return {
    content: formatter.format(number),
    separator: ''
  }
}
