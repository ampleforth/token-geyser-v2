import { useLazyQuery } from '@apollo/client'
import { BigNumber, Signer } from 'ethers'
import { createContext, useContext, useEffect, useState } from 'react'
import { GET_USER_VAULTS } from '../queries/vault'
import { POLL_INTERVAL } from '../constants'
import { Vault } from '../types'
import { getTokenBalances } from '../sdk/helpers'
import Web3Context from './Web3Context'
import { toChecksumAddress } from 'web3-utils'
import { LoadingSpinner } from '../components/LoadingSpinner'

export const VaultContext = createContext<{
  vaults: Vault[]
  selectedVault: Vault | null
  selectVault: (arg0: Vault) => void
  resetVault: Function
  getBalances: (
    tokenAddresses: string[],
    vaultAddress: string,
    signer: Signer,
  ) => Promise<PromiseSettledResult<BigNumber>[]>
}>({
  vaults: [],
  selectedVault: null,
  selectVault: () => {},
  resetVault: () => {},
  getBalances: async () => [],
})

export const VaultContextProvider: React.FC = ({ children }) => {
  const { address } = useContext(Web3Context)
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: POLL_INTERVAL,
  })

  const [vaults, setVaults] = useState<Vault[]>([])
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null)

  const resetVault = () => setSelectedVault(null)
  const selectVault = (vault: Vault) => setSelectedVault(vault)

  const getBalances = async (tokenAddresses: string[], vaultAddress: string, signer: Signer) =>
    getTokenBalances(tokenAddresses.map(toChecksumAddress), vaultAddress, signer)

  useEffect(() => {
    if (address) getVaults({ variables: { id: address } })
  }, [address, getVaults])

  useEffect(() => {
    if (vaultData && vaultData.user) {
      const userVaults = vaultData.user.vaults as Vault[]
      setVaults(userVaults)
    }
  }, [vaultData])

  if (vaultLoading) return <LoadingSpinner />

  return (
    <VaultContext.Provider
      value={{
        vaults,
        selectedVault,
        selectVault,
        resetVault,
        getBalances,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}
