import React, { createContext, useCallback, useEffect, useState } from 'react'
import { API, Wallet } from 'bnc-onboard/dist/src/interfaces'
import Onboard from 'bnc-onboard'
import { providers, Signer, utils } from 'ethers'
import { getConnectionConfig, activeNetworks } from 'config/app'
import { Network, ALCHEMY_PROJECT_ID, INFURA_PROJECT_ID } from '../constants'

// const DEFAULT_RPC_ENDPOINT = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
// ALCHEMY_PROJECT_ID
const DEFAULT_RPC_ENDPOINT = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`

const SUPPORTED_WALLETS = [
  { walletName: 'metamask', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  {
    walletName: 'walletConnect',
    preferred: true,
    infuraKey: INFURA_PROJECT_ID,
  },
  {
    walletName: 'walletLink',
    label: 'Coinbase Wallet',
    preferred: true,
    rpcUrl: DEFAULT_RPC_ENDPOINT,
  },
  { walletName: 'wallet.io', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  { walletName: 'imToken', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  { walletName: 'coinbase', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  { walletName: 'status', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  { walletName: 'trust', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT },
  { walletName: 'authereum', preferred: true, rpcUrl: DEFAULT_RPC_ENDPOINT }, // currently getting rate limited
]

const defaultProvider = new providers.JsonRpcProvider(DEFAULT_RPC_ENDPOINT, {
  chainId: 1,
  name: 'mainnet',
})

const Web3Context = createContext<{
  address?: string
  wallet: Wallet | null
  onboard?: API
  provider: providers.Provider
  signer?: Signer
  selectWallet: () => Promise<boolean>
  disconnectWallet: () => Promise<boolean>
  ready: boolean
  networkId: number
  selectNetwork: (networkId: number) => Promise<boolean>
}>({
  selectWallet: async () => false,
  disconnectWallet: async () => false,
  selectNetwork: async () => false,
  ready: false,
  wallet: null,
  provider: defaultProvider,
  networkId: Network.Mainnet,
})

interface Subscriptions {
  wallet: (wallet: Wallet) => void
  network: (networkId: number) => void
  address: React.Dispatch<React.SetStateAction<string | undefined>>
}
const initOnboard = (networkId: number, subscriptions: Subscriptions): API =>
  Onboard({
    networkId,
    subscriptions,
    hideBranding: true,
    walletSelect: {
      wallets: SUPPORTED_WALLETS,
    },
  })

type Props = {
  children?: React.ReactNode
}

const defaultProps: Props = {
  children: null,
}

const Web3Provider: React.FC = ({ children }: Props) => {
  const [address, setAddress] = useState<string>()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [onboard, setOnboard] = useState<API>()
  const [provider, setProvider] = useState<providers.Provider>(defaultProvider)
  const [networkId, setNetworkId] = useState<number>(Network.Mainnet)
  const [signer, setSigner] = useState<Signer>()
  const [ready, setReady] = useState(false)

  const updateWallet = useCallback(async (newWallet: Wallet) => {
    if (!newWallet) return
    const walletProvider = new providers.Web3Provider(newWallet.provider, 'any')
    const network = await walletProvider.getNetwork()
    const walletNetworkId = network.chainId
    if (activeNetworks.includes(walletNetworkId)) {
      const walletSigner = walletProvider.getSigner()
      setWallet(newWallet)
      setSigner(walletSigner)
      if (newWallet && newWallet.name) {
        localStorage.setItem('selectedWallet', newWallet.name)
      }
    } else {
      setWallet(null)
      setSigner(undefined)
    }
  }, [])

  const updateProvider = useCallback((newNetworkId: number) => {
    if (activeNetworks.includes(newNetworkId)) {
      const conn = getConnectionConfig(newNetworkId)
      const rpcProvider = new providers.JsonRpcProvider(conn.rpcUrl, {
        chainId: conn.networkId,
        name: conn.ref,
      })
      setProvider(rpcProvider)
      setNetworkId(newNetworkId as Network)
    } else {
      setProvider(defaultProvider)
      setNetworkId(Network.Mainnet)
    }
  }, [])

  useEffect(() => {
    const onboardAPI = initOnboard(networkId, {
      address: setAddress,
      wallet: (w: Wallet) => {
        if (w?.provider?.selectedAddress) {
          updateWallet(w)
        } else {
          setWallet(null)
          setSigner(undefined)
        }
      },
      network: (newNetworkId: number) => {
        updateProvider(newNetworkId)
      },
    })
    setOnboard(onboardAPI)
  }, [updateWallet, updateProvider])

  const selectWallet = async (): Promise<boolean> => {
    if (!onboard) return false
    const walletSelected = await onboard.walletSelect()
    if (!walletSelected) return false
    const isReady = await onboard.walletCheck()
    setReady(isReady)
    if (isReady) updateWallet(onboard.getState().wallet)
    return isReady
  }

  useEffect(() => {
    ;(async () => {
      const previouslySelectedWallet = localStorage.getItem('selectedWallet')
      if (previouslySelectedWallet && onboard) {
        const walletSelected = await onboard.walletSelect(previouslySelectedWallet)
        setReady(walletSelected)
      } else {
        await selectWallet()
      }
    })()
  }, [onboard])

  const disconnectWallet = async (): Promise<boolean> => {
    if (!onboard) return false
    onboard.walletReset()
    localStorage.removeItem('selectedWallet')
    await selectWallet()
    return true
  }

  const selectNetwork = async (newNetworkId: number) => {
    const conn = getConnectionConfig(newNetworkId)
    try {
      await wallet?.provider?.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: utils.hexValue(conn.networkId),
            chainName: conn.ref,
            rpcUrls: [conn.rpcUrl],
            blockExplorerUrls: [conn.explorerUrl],
            nativeCurrency: conn.nativeCurrency,
          },
        ],
      })
    } catch (e) {
      console.log(e)
    }

    await wallet?.provider?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: utils.hexValue(newNetworkId) }],
    })

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
        networkId,
        selectNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

Web3Provider.defaultProps = defaultProps

export { Web3Provider }

export default Web3Context
