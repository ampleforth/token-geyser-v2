import { API, Wallet } from 'bnc-onboard/dist/src/interfaces'
import Onboard from 'bnc-onboard'
import React, { createContext, useCallback, useEffect, useState } from 'react'
import { providers, Signer } from 'ethers'
import { getDefaultProvider } from '../utils/eth'
import { INFURA_PROJECT_ID } from '../constants'

const INFURA_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`

const SUPPORTED_WALLETS = [
  { walletName: 'metamask', preferred: true, rpcUrl: INFURA_ENDPOINT },
  {
    walletName: 'walletConnect',
    preferred: true,
    infuraKey: INFURA_PROJECT_ID,
  },
  { walletName: 'walletLink', label: 'Coinbase Wallet', preferred: true, rpcUrl: INFURA_ENDPOINT },
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
  selectWallet: () => Promise<boolean>
  ready: boolean
}>({
  selectWallet: async () => false,
  ready: false,
  wallet: null,
  provider: null,
  defaultProvider: getDefaultProvider(),
})

interface Subscriptions {
  wallet: (wallet: Wallet) => void
  address: React.Dispatch<React.SetStateAction<string | undefined>>
}

const initOnboard = (subscriptions: Subscriptions): API => {
  const network =
    process.env.NODE_ENV === 'development' ? { networkId: 1337, networkName: 'localhost' } : { networkId: 1 } // mainnet

  return Onboard({
    ...network,
    subscriptions,
    hideBranding: true,
    walletSelect: {
      wallets: SUPPORTED_WALLETS,
    },
  })
}

const Web3Provider: React.FC = ({ children }) => {
  const [address, setAddress] = useState<string>()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [onboard, setOnboard] = useState<API>()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [defaultProvider] = useState<providers.Provider>(getDefaultProvider())
  const [signer, setSigner] = useState<Signer>()
  const [ready, setReady] = useState(false)

  const updateWallet = useCallback((newWallet: Wallet) => {
    setWallet(newWallet)
    if (newWallet && newWallet.name) localStorage.setItem('selectedWallet', newWallet.name)
    const network = process.env.NODE_ENV === 'development' ? { name: 'localhost', chainId: 1337 } : undefined
    const ethersProvider = new Provider(newWallet.provider, network)
    const rpcSigner = ethersProvider.getSigner()
    setSigner(rpcSigner)
    setProvider(ethersProvider)
  }, [])

  useEffect(() => {
    const onboardAPI = initOnboard({
      address: setAddress,
      wallet: (w: Wallet) => {
        if (w?.provider?.selectedAddress) {
          updateWallet(w)
        } else {
          setProvider(null)
          setWallet(null)
        }
      },
    })
    setOnboard(onboardAPI)
  }, [updateWallet])

  useEffect(() => {
    (async () => {
      const previouslySelectedWallet = localStorage.getItem('selectedWallet')
      if (previouslySelectedWallet && onboard) {
        const walletSelected = await onboard.walletSelect(previouslySelectedWallet)
        setReady(walletSelected)
      }
    })();
  }, [onboard])

  const selectWallet = async (): Promise<boolean> => {
    if (!onboard) return false
    const walletSelected = await onboard.walletSelect()
    if (!walletSelected) return false
    const isReady = await onboard.walletCheck()
    setReady(isReady)
    if (isReady) updateWallet(onboard.getState().wallet)
    return isReady
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
        ready,
        defaultProvider,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export { Web3Provider }

export default Web3Context
