import { VaultState } from './constants'

export interface VaultMetaData {
  id: string
  state: VaultState
}

export interface Vault {
  id: string
  nonce: string
  // TODO: proper typing for reward and lock
  claimedReward: any[]
  locks: any[]
}
