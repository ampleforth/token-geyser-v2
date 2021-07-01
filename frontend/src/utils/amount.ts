import { BigNumberish } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { safeNumeral } from './numeral'

export const amountOrZero = (amount?: BigNumberish) => amount || '0'

export const formatAmount = (amount: BigNumberish, decimals: number) =>
  safeNumeral(parseFloat(formatUnits(amount, decimals)), '0.00000')
