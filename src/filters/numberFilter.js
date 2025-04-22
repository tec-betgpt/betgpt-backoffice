export default (value) => {
  if (value >= 1000000) {
    let millions = value / 1000000;
    return `R$ ${
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    }kk`;
  } else if (value >= 1000) {
    let thousands = value / 1000;
    return `R$ ${
      thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    }k`;
  } else {
    return `R$ ${value.toFixed(0)}`;
  }
}
