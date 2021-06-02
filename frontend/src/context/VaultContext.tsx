import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { GET_USER_VAULTS } from '../queries/vault'
import { POLL_INTERVAL } from '../constants'
import { Lock, Vault } from '../types'
import Web3Context from './Web3Context'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GeyserContext } from './GeyserContext'

export const VaultContext = createContext<{
  vaults: Vault[]
  selectedVault: Vault | null
  selectVault: (arg0: Vault) => void
  currentLock: Lock | null
}>({
  vaults: [],
  selectedVault: null,
  selectVault: () => {},
  currentLock: null,
})

export const VaultContextProvider: React.FC = ({ children }) => {
  const { address } = useContext(Web3Context)
  const { selectedGeyser } = useContext(GeyserContext)
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: POLL_INTERVAL,
  })

  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null)
  const [currentLock, setCurrentLock] = useState<Lock | null>(null)

  const selectVault = (vault: Vault) => setSelectedVault(vault)

  useEffect(() => {
    if (address) getVaults({ variables: { id: address } })
  }, [address, getVaults])

  useEffect(() => {
    if (vaultData && vaultData.user) {
      const userVaults = vaultData.user.vaults as Vault[]
      setVaults(userVaults)
      if (userVaults.length > 0 && selectedVault === null) {
        selectVault(userVaults[0])
      } else if (userVaults.length > 0) {
        setSelectedVault(userVaults.find(vault => vault.id === selectedVault?.id) || userVaults[0])
      }
    }
  }, [vaultData, selectedVault])

  useEffect(() => {
    if (selectedVault && selectedGeyser) {
      const { stakingToken } = selectedGeyser
      const lockId = `${selectedVault.id}-${selectedGeyser.id}-${stakingToken}`
      const lock = selectedVault.locks.find(lock => lock.id === lockId) || null
      setCurrentLock(lock)
    }
  }, [selectedVault, selectedGeyser])

  if (vaultLoading) return <LoadingSpinner />

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        selectVault,
        currentLock,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
