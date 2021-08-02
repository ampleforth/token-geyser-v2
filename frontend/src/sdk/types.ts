import { BigNumber } from 'ethers'

export type VaultData = {
  totalStake: BigNumber
  stakes: UserStake[]
}

export type UserStake = {
  timestamp: BigNumber
  amount: BigNumber
}
