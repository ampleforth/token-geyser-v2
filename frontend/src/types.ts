import { BigNumber } from 'ethers'

type ClaimedReward = {
  id: string
  token: string
  amount: string
  lastUpdate: string
}

export type Vault = {
  id: string
  nonce: string
  // TODO: proper typing for reward
  claimedReward: ClaimedReward[]
  locks: Lock[]
}

export type Geyser = {
  id: string
}

export type Lock = {
  id: string
  geyser: Geyser
  token: string
  amount: string
}

export type TokenBalance = {
  address: string
  balance: BigNumber
  name: string
}
