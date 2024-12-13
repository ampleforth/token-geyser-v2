import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { safeNumeral } from './numeral'

export const amountOrZero = (amount?: BigNumberish) => amount || '0'

export const formatAmount = (amount: BigNumberish, decimals: number) =>
  safeNumeral(parseFloat(formatUnits(amount, decimals)), '0.000')

function toSubscript(num) {
  const subscriptMap = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  }
  return String(num)
    .split('')
    .map((char) => subscriptMap[char] || char)
    .join('')
}

export function formatTokenBalance(balance, defaultFormat = '0,0.000', precision = 1000, largeFormat = '0.000a') {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance
  if (num < 1 / precision && num !== 0) {
    const numStr = num.toFixed(20).replace(/0+$/, '')
    const [, decimalPart = ''] = numStr.split('.')
    const leadingZeros = decimalPart.match(/^0+/)?.[0]?.length || 0
    const significantDigits = decimalPart.slice(leadingZeros)
    const subscriptZeros = toSubscript(leadingZeros)
    return `0.0${subscriptZeros}${significantDigits}`
  } else if (num > 1000000) {
    return safeNumeral(num, largeFormat)
  }
  return safeNumeral(num, defaultFormat)
}
