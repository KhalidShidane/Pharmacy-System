const cache = new Map();

function getFormatter(currency) {
  const key = currency || 'USD';
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: key,
        currencyDisplay: 'narrowSymbol',
      })
    );
  }
  return cache.get(key);
}

export function formatCurrency(value, currency = 'USD') {
  const amount = Number(value) || 0;
  try {
    return getFormatter(currency).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
