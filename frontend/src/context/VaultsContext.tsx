import { useLazyQuery, useQuery } from '@apollo/client'
import { BigNumber, Signer } from 'ethers'
import { createContext, useContext, useEffect, useState } from 'react'
import { GET_GEYSERS } from '../queries/geyser'
import { GET_USER_VAULTS } from '../queries/vault'
import { POLL_INTERVAL } from '../constants'
import { Geyser, Vault } from '../types'
import { getTokenBalances } from '../sdk/tokens'
import Web3Context from './Web3Context'
import { toChecksumAddress } from 'web3-utils'

const VaultsContext = createContext<{
  vaults: Vault[];
  geysers: Geyser[];
  selectedVault?: Vault;
  setSelectedVault: React.Dispatch<React.SetStateAction<Vault | undefined>>;
  resetVault: Function;
  getBalances: (tokenAddresses: string[], vaultAddress: string, signer: Signer) => Promise<PromiseSettledResult<BigNumber>[]>;
}>({
  vaults: [],
  geysers: [],
  setSelectedVault: () => {},
  resetVault: () => {},
  getBalances: async () => [],
})

const VaultsProvider: React.FC = ({ children }) => {
  const { address } = useContext(Web3Context);
  const [getVaults, { loading: vaultLoading, data: vaultData }] = useLazyQuery(GET_USER_VAULTS, { pollInterval: POLL_INTERVAL });
  const { loading: geyserLoading, data: geyserData } = useQuery(GET_GEYSERS);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [geysers, setGeysers] = useState<Geyser[]>([]);
  const [selectedVault, setSelectedVault] = useState<Vault>();

  const resetVault = () => { setSelectedVault(undefined) };

  const getBalances = async (tokenAddresses: string[], vaultAddress: string, signer: Signer) =>
    getTokenBalances(tokenAddresses.map(toChecksumAddress), vaultAddress, signer);

  useEffect(() => {
    if (address) getVaults({ variables: { id: address } });
  }, [address]);

  useEffect(() => {
    if (vaultData && vaultData.user) {
      const userVaults = vaultData.user.vaults as Vault[];
      setVaults(userVaults);
    }
  }, [vaultData]);

  useEffect(() => {
    if (geyserData && geyserData.geysers)
      setGeysers(geyserData.geysers as Geyser[]);
  }, [geyserData]);

  if (vaultLoading || geyserLoading) return <></>;

  return (
    <VaultsContext.Provider
      value={{
        vaults,
        geysers,
        selectedVault,
        setSelectedVault,
        resetVault,
        getBalances,
      }}
    >
      {children}
    </VaultsContext.Provider>
  )
}

export { VaultsProvider };

export default VaultsContext;
