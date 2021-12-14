import React, { createContext, useCallback, useEffect, useState } from 'react';
import { API, Wallet } from 'bnc-onboard/dist/src/interfaces';
import Onboard from 'bnc-onboard';
import { getDefaultProvider, providers, Signer, utils } from 'ethers';
import { getConnectionConfig } from 'config/app'
import { Network, INFURA_PROJECT_ID } from '../constants'

const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
const SUPPORTED_WALLETS = [
  { walletName: 'metamask', preferred: true, rpcUrl: INFURA_ENDPOINT },
  {
    walletName: 'walletConnect',
    preferred: true,
    infuraKey: INFURA_PROJECT_ID,
  },
  {
    walletName: 'walletLink', label: 'Coinbase Wallet', preferred: true, rpcUrl: INFURA_ENDPOINT,
  },
  { walletName: 'wallet.io', preferred: true, rpcUrl: INFURA_ENDPOINT },
  { walletName: 'imToken', preferred: true, rpcUrl: INFURA_ENDPOINT },
  { walletName: 'coinbase', preferred: true, rpcUrl: INFURA_ENDPOINT },
  { walletName: 'status', preferred: true, rpcUrl: INFURA_ENDPOINT },
  { walletName: 'trust', preferred: true, rpcUrl: INFURA_ENDPOINT },
  { walletName: 'authereum', preferred: true, rpcUrl: INFURA_ENDPOINT }, // currently getting rate limited
];

class Provider extends providers.Web3Provider {}

const Web3Context = createContext<{
  address?: string
  wallet: Wallet | null
  onboard?: API
  provider: Provider | null
  defaultProvider: providers.Provider
  signer?: Signer
  selectWallet:() => Promise<boolean>
  disconnectWallet:() => Promise<boolean>
  ready: boolean
  networkId: number
  selectNetwork:(networkId:number) => Promise<boolean>
    }>({
      selectWallet: async () => false,
      disconnectWallet: async () => false,
      selectNetwork: async () => false,
      ready: false,
      wallet: null,
      provider: null,
      defaultProvider: getDefaultProvider(),
      networkId: Network.Mainnet,
    });

interface Subscriptions {
  wallet: (wallet: Wallet) => void
  network: (networkId: number) => void
  address: React.Dispatch<React.SetStateAction<string | undefined>>
}
const initOnboard = (networkId: number, subscriptions: Subscriptions): API => Onboard({
  networkId,
  subscriptions,
  hideBranding: true,
  walletSelect: {
    wallets: SUPPORTED_WALLETS,
  },
});

type Props = {
  children?: React.ReactNode;
};

const defaultProps: Props = {
  children: null,
};

const Web3Provider: React.FC = ({ children }: Props) => {
  const [address, setAddress] = useState<string>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [onboard, setOnboard] = useState<API>();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [networkId, setNetworkId] = useState<number>(Network.Mainnet);
  const [defaultProvider] = useState<providers.Provider>(getDefaultProvider());
  const [signer, setSigner] = useState<Signer>();
  const [ready, setReady] = useState(false);

  const updateWallet = useCallback((newWallet: Wallet) => {
    setWallet(newWallet);
    if (newWallet && newWallet.name) localStorage.setItem('selectedWallet', newWallet.name);
    const ethersProvider = new Provider(newWallet.provider, 'any');
    // ethersProvider.on('chainChanged', (newNetworkId) => {
    //   if (newNetworkId && newNetworkId !== networkId) {
    //     // window.location.reload();
    //     setNetworkId(newNetworkId);
    //     // updateWallet(newWallet);
    //   }
    // });
    const rpcSigner = ethersProvider.getSigner();
    setSigner(rpcSigner);
    setProvider(ethersProvider);
  }, []);

  useEffect(() => {
    const onboardAPI = initOnboard(networkId, {
      address: setAddress,
      wallet: (w: Wallet) => {
        if (w?.provider?.selectedAddress) {
          updateWallet(w);
        } else {
          setProvider(null);
          setWallet(null);
        }
      },
      network: (newNetworkId: number) => {
        if (newNetworkId !== networkId && newNetworkId in Network) {
          setNetworkId(newNetworkId as Network);
        }
      },
    });
    setOnboard(onboardAPI);
  }, [networkId, updateWallet]);

  const selectWallet = async (): Promise<boolean> => {
    if (!onboard) return false;
    const walletSelected = await onboard.walletSelect();
    if (!walletSelected) return false;
    const isReady = await onboard.walletCheck();
    setReady(isReady);
    if (isReady) updateWallet(onboard.getState().wallet);
    return isReady;
  };

  useEffect(() => {
    (async () => {
      const previouslySelectedWallet = localStorage.getItem('selectedWallet');
      if (previouslySelectedWallet && onboard) {
        const walletSelected = await onboard.walletSelect(previouslySelectedWallet);
        setReady(walletSelected);
      } else {
        await selectWallet();
      }
    })();
  }, [onboard]);

  const disconnectWallet = async (): Promise<boolean> => {
    if (!onboard) return false;
    onboard.walletReset();
    localStorage.removeItem('selectedWallet');
    await selectWallet();
    return true;
  };

  const selectNetwork = async (newNetworkId: number) => {
    const conn = getConnectionConfig(networkId)

    try{
      if(newNetworkId !== Network.Mainnet){
        await wallet?.provider?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: utils.hexValue(conn.chainId),
              chainName: conn.name,
              rpcUrls: [conn.rpcUrl],
              blockExplorerUrls: [conn.explorerUrl],
            },
          ],
        });    
      }
    } catch(e) {
      console.log(e)
    }
    
    await wallet?.provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: utils.hexValue(newNetworkId) }]
    });

    return true
  }

  return (
    <Web3Context.Provider
      value={{
        address,
        wallet,
        onboard,
        provider,
        signer,
        selectWallet,
        disconnectWallet,
        ready,
        defaultProvider,
        networkId,
        selectNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

Web3Provider.defaultProps = defaultProps;

export { Web3Provider };

export default Web3Context;
