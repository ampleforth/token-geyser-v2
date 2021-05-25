import { NamedColors } from './styling/colors'

export enum VaultState {
  ACTIVE,
  STALE,
  INACTIVE,
}

export const VaultStateColors: Record<VaultState, string> = {
  [VaultState.ACTIVE]: NamedColors.APPLE,
  [VaultState.STALE]: NamedColors.SCHOOL_BUS_YELLOW,
  [VaultState.INACTIVE]: NamedColors.RED_ORANGE,
}

const second = 1000
export const POLL_INTERVAL = 5 * second

export const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

export enum ManageVaultView {
  BALANCE = 'BALANCE',
  STAKE = 'STAKE',
}

