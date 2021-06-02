import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

export const amountOrZero = (amount?: BigNumberish) => amount || '0'

export const formatAmount = (amount: BigNumberish, decimals: number, symbol: string) =>
  `${formatUnits(amount, decimals)} ${symbol}`
