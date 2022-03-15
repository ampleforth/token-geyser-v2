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
import { Centered } from '../styling/styles'

export const VaultContext = createContext<{
  vaults: Vault[]
  selectedVault: Vault | null
  selectVault: (arg0: Vault) => void
  selectVaultById: (id: string) => void
  currentLock: Lock | null
  withdrawFromVault: ((tokenAddress: string, amount: BigNumber) => Promise<TransactionResponse>) | null
  withdrawRewardsFromVault: ((receipt: TransactionReceipt) => Promise<{ response: TransactionResponse, rewards: BigNumber } | null>) | null
  withdrawUnlockedFromVault: ((tokenAddress: string) => Promise<{ response: TransactionResponse, amount: BigNumber } | null>) | null
  rewardAmountClaimedOnUnstake:  ((receipt: TransactionReceipt) => Promise<BigNumber>) | null
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
})

export const VaultContextProvider: React.FC = ({ children }) => {
  const { address, signer, ready, networkId } = useContext(Web3Context)
  const { selectedGeyserInfo: { geyser: selectedGeyser } } = useContext(GeyserContext)
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: POLL_INTERVAL,
  })

  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null)
  const [currentLock, setCurrentLock] = useState<Lock | null>(null)

  const selectVault = (vault: Vault) => setSelectedVault(vault)
  const selectVaultById = (id: string) => setSelectedVault(vaults.find(vault => vault.id === id) || selectedVault)
  const withdrawFromVault = address && signer && selectedVault
    ? (tokenAddress: string, amount: BigNumber) => withdraw(selectedVault.id, tokenAddress, address, amount, signer)
    : null

  const rewardAmountClaimedOnUnstake = signer && selectedGeyser
    ? async (receipt: TransactionReceipt) => {
      const rewardsClaimed = await getRewardsClaimedFromUnstake(receipt, selectedGeyser.id, signer)
      return rewardsClaimed ? rewardsClaimed.amount : BigNumber.from("0")
    }
    : null

  const withdrawRewardsFromVault = address && signer && selectedGeyser
    ? (receipt: TransactionReceipt) => withdrawRewards(selectedGeyser.id, address, receipt, signer)
    : null

  const withdrawUnlockedFromVault = address && signer && selectedVault
    ? (tokenAddress: string) => withdrawUnlocked(selectedVault.id, tokenAddress, address, signer)
    : null

  useEffect(() => {
    if (address) getVaults({ variables: { id: address.toLowerCase() } })
  }, [networkId, address, getVaults])

  useEffect(() => {
    if (vaultData && vaultData.user) {
      const userVaults = vaultData.user.vaults as Vault[]
      setVaults(userVaults)
      if (userVaults.length > 0 && !selectedVault) {
        selectVault(userVaults[0])
      } else if (userVaults.length > 0) {
        setSelectedVault(userVaults.find((vault) => vault.id === selectedVault?.id) || userVaults[0])
      } else {
        setSelectedVault(null)
      }
    } else {
      setVaults([])
      setSelectedVault(null)
    }
  }, [vaultData, selectedVault])

  useEffect(() => {
    if (selectedVault && selectedGeyser) {
      const { stakingToken } = selectedGeyser
      const lockId = `${selectedVault.id}-${selectedGeyser.id}-${stakingToken}`
      setCurrentLock(selectedVault.locks.find((lock) => lock.id === lockId) || null)
    }
  }, [selectedVault, selectedGeyser])

  if (vaultLoading || (!address && ready)) return <Centered>Loading...</Centered>

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
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
