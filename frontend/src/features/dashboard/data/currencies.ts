import type { Currency, CurrencyCode } from '../types'

export const CURRENCIES: Currency[] = [
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', rateToPLR: 50 },
  { code: 'USD', symbol: 'US$', name: 'Dólar', rateToPLR: 0.05 },
  { code: 'CLP', symbol: 'CL$', name: 'Peso Chileno', rateToPLR: 47 },
  { code: 'BRL', symbol: 'R$', name: 'Real', rateToPLR: 0.28 },
  { code: 'EUR', symbol: '€', name: 'Euro', rateToPLR: 0.045 },
  { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano', rateToPLR: 0.85 },
]

export const DEFAULT_CURRENCY: CurrencyCode = 'ARS'

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]!
}

export function formatFiatPrice(pricePLR: number | undefined, currency: Currency): string {
  if (pricePLR == null || isNaN(pricePLR)) return `${currency.symbol} —`
  const fiatAmount = pricePLR * currency.rateToPLR
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: currency.rateToPLR < 1 ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(fiatAmount)
  return `${currency.symbol} ${formatted}`
}
