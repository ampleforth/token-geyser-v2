import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { withdraw, withdrawRewards, withdrawUnlocked } from 'sdk'
import { getRewardsClaimedFromUnstake } from 'sdk/stats'
import { GET_USER_VAULTS } from '../queries/vault'
import { POLL_INTERVAL } from '../constants'
import { Lock, Vault } from '../types'
import Web3Context from './Web3Context'
import { GeyserContext } from './GeyserContext'

export const VaultContext = createContext<{
  vaults: Vault[]
  selectedVault: Vault | null
  selectVault: (arg0: Vault) => void
  selectVaultById: (id: string) => void
  currentLock: Lock | null
  withdrawFromVault: ((tokenAddress: string, amount: BigNumber) => Promise<TransactionResponse>) | null
  withdrawRewardsFromVault:
    | ((receipt: TransactionReceipt) => Promise<{ response: TransactionResponse; rewards: BigNumber } | null>)
    | null
  withdrawUnlockedFromVault:
    | ((tokenAddress: string) => Promise<{ response: TransactionResponse; amount: BigNumber } | null>)
    | null
  rewardAmountClaimedOnUnstake: ((receipt: TransactionReceipt) => Promise<BigNumber>) | null
  loading: bool
}>({
  vaults: [],
  selectedVault: null,
  selectVault: () => {},
  selectVaultById: () => {},
  currentLock: null,
  withdrawFromVault: null,
  withdrawRewardsFromVault: null,
  withdrawUnlockedFromVault: null,
  rewardAmountClaimedOnUnstake: null,
  loading: false,
})

export const VaultContextProvider: React.FC = ({ children }) => {
  const { address, signer, ready, networkId } = useContext(Web3Context)
  const {
    selectedGeyserInfo: { geyser: selectedGeyser },
    loading: geyserLoading,
    geysers,
  } = useContext(GeyserContext)
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: POLL_INTERVAL,
  })

  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null)
  const [currentLock, setCurrentLock] = useState<Lock | null>(null)

  const selectVault = (vault: Vault) => setSelectedVault(vault)
  const selectVaultById = (id: string) => setSelectedVault(vaults.find((vault) => vault.id === id) || selectedVault)
  const withdrawFromVault =
    ready && selectedVault
      ? (tokenAddress: string, amount: BigNumber) => withdraw(selectedVault.id, tokenAddress, address, amount, signer)
      : null

  const rewardAmountClaimedOnUnstake =
    ready && selectedGeyser
      ? async (receipt: TransactionReceipt) => {
          const rewardsClaimed = await getRewardsClaimedFromUnstake(receipt, selectedGeyser.id, signer)
          return rewardsClaimed ? rewardsClaimed.amount : BigNumber.from('0')
        }
      : null

  const withdrawRewardsFromVault =
    ready && selectedGeyser
      ? (receipt: TransactionReceipt) => withdrawRewards(selectedGeyser.id, address, receipt, signer)
      : null

  const withdrawUnlockedFromVault =
    ready && selectedVault
      ? (tokenAddress: string) => withdrawUnlocked(selectedVault.id, tokenAddress, address, signer)
      : null

  useEffect(() => {
    if (address) {
      console.log('vault refresh')
      setVaults([])
      setSelectedVault(null)
      setCurrentLock(null)
      getVaults({ variables: { id: address.toLowerCase() } })
    }
  }, [ready, networkId, address, getVaults])

  useEffect(() => {
    if (ready && vaultData?.user && geysers.length > 0) {
      const userVaults = vaultData.user.vaults as Vault[]
      setVaults(userVaults)
      if (userVaults.length > 0 && !selectedVault) {
        selectVault(userVaults[0])
      } else if (userVaults.length > 0) {
        setSelectedVault(userVaults.find((vault) => vault.id === selectedVault?.id) || userVaults[0])
      } else {
        setSelectedVault(null)
      }
    }
  }, [vaultData, selectedVault, geyserLoading])

  useEffect(() => {
    if (address && selectedVault && geysers.length > 0 && selectedGeyser) {
      const { stakingToken } = selectedGeyser
      const lockId = `${selectedVault.id}-${selectedGeyser.id}-${stakingToken}`
      setCurrentLock(selectedVault.locks.find((lock) => lock.id === lockId) || null)
    } else {
      setCurrentLock(null)
    }
  }, [address, selectedVault, selectedGeyser, geyserLoading])

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        selectVault,
        selectVaultById,
        currentLock,
        withdrawFromVault,
        withdrawRewardsFromVault,
        withdrawUnlockedFromVault,
        rewardAmountClaimedOnUnstake,
        loading: !ready || vaultLoading || geyserLoading,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
