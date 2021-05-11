export enum VaultState {
  ACTIVE,
  STALE,
  INACTIVE,
}

export const stateToColor: Record<VaultState, string> = {
  [VaultState.ACTIVE]: '#2ECC40', // green
  [VaultState.STALE]: '#FFDC00', // yellow
  [VaultState.INACTIVE]: '#FF4136', // red
}
