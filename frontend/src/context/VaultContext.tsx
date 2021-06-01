import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { GET_USER_VAULTS } from '../queries/vault'
import { POLL_INTERVAL } from '../constants'
import { Vault } from '../types'
import Web3Context from './Web3Context'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const VaultContext = createContext<{
  vaults: Vault[]
  selectedVault: Vault | null
  selectVault: (arg0: Vault) => void
}>({
  vaults: [],
  selectedVault: null,
  selectVault: () => {},
})

export const VaultContextProvider: React.FC = ({ children }) => {
  const { address } = useContext(Web3Context)
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: POLL_INTERVAL,
  })

  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null)

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
      }
    }
  }, [vaultData, selectedVault])

  if (vaultLoading) return <LoadingSpinner />

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        selectVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
