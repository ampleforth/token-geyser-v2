import React, { createContext } from 'react'
import { init, useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import coinbaseModule from '@web3-onboard/coinbase'
import metamaskModule from '@web3-onboard/metamask'

import { providers } from 'ethers'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { getConnectionConfig, activeNetworks } from 'config/app'
import { Network, ALCHEMY_PROJECT_ID } from '../constants'

const DEFAULT_RPC_ENDPOINT = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`

const defaultProvider = new StaticJsonRpcProvider(DEFAULT_RPC_ENDPOINT, {
  name: 'mainnet',
  chainId: 1,
})

const Web3Context = createContext({
  address: undefined,
  wallet: null,
  provider: defaultProvider,
  signer: undefined,
  connectWallet: async () => false,
  disconnectWallet: async () => false,
  ready: false,
  networkId: Network.Mainnet,
  selectNetwork: async () => false,
  validNetwork: true,
})

const injected = injectedModule()
const coinbase = coinbaseModule({
  appName: 'Geyser',
  appLogoUrl: 'https://assets.fragments.org/ampl.png',
  dappUrl: 'https://geyser.ampleforth.org',
})
const metamask = metamaskModule({
  options: {
    extensionOnly: false,
    i18nOptions: {
      enabled: true,
    },
    dappMetadata: {
      name: 'Geyser',
    },
  },
})

init({
  connect: {
    autoConnectAllPreviousWallet: true,
  },
  wallets: [injected, metamask, coinbase],
  chains: activeNetworks.map((networkId) => {
    const config = getConnectionConfig(networkId)
    return {
      id: `0x${networkId.toString(16)}`,
      token: config.nativeCurrency.symbol,
      label: config.ref,
      rpcUrl: config.rpcUrl,
    }
  }),
  appMetadata: {
    name: 'Geyser',
    description: 'Geysers are smart faucets that incentivize AMPL and SPOT on-chain liquidity.',
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <rect width="256" height="256" rx="48" fill="#000" />
        <text
          x="50%"
          y="50%"
          fill="#fff"
          font-size="128"
          font-family="Coromont Garamond"
          text-anchor="middle"
          dominant-baseline="middle"
        >
          Λ
        </text>
      </svg>
    `,
  },
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false },
  },
  apiKey: ALCHEMY_PROJECT_ID,
})

const Web3Provider = ({ children }) => {
  const [, connect, disconnect] = useConnectWallet()
  const { setChain: selectNetwork } = useSetChain()
  const wallets = useWallets()
  const wallet = wallets[0] || null
  const ready = !!wallet
  const address = ready ? wallet?.accounts[0]?.address : null
  const provider = ready ? new providers.Web3Provider(wallet.provider, 'any') : defaultProvider
  const signer = ready ? provider.getUncheckedSigner() : null
  const chainId = ready ? wallet?.chains[0]?.id : null
  const networkId = ready ? parseInt(chainId, 16) : Network.Mainnet
  const validNetwork = activeNetworks.includes(networkId)
  return (
    <Web3Context.Provider
      value={{
        address,
        wallet,
        provider,
        signer,
        connectWallet: connect,
        disconnectWallet: disconnect,
        ready,
        networkId,
        selectNetwork,
        validNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export { Web3Provider }
export default Web3Context
