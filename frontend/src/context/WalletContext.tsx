import { BigNumber } from 'ethers'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { ERC20Balance } from '../sdk'
import { GeyserContext } from './GeyserContext'
import Web3Context from './Web3Context'

export const WalletContext = createContext<{
  walletAmount: BigNumber
  refreshWalletAmount: () => void
}>({
  walletAmount: BigNumber.from('0'),
  refreshWalletAmount: () => {},
})

export const WalletContextProvider: React.FC = ({ children }) => {
  const [walletAmount, setWalletAmount] = useState<BigNumber>(BigNumber.from('0'))
  const { signer } = useContext(Web3Context)
  const { selectedGeyserInfo: { geyser: selectedGeyser } } = useContext(GeyserContext)

  const getWalletAmount = useCallback(async () => {
    if (selectedGeyser && signer) {
      const { stakingToken } = selectedGeyser
      try {
        const balance = await ERC20Balance(stakingToken, await signer.getAddress(), signer)
        return balance
      } catch (e) {
        console.error(e)
        return BigNumber.from('0')
      }
    }
    return BigNumber.from('0')
  }, [selectedGeyser?.stakingToken, signer])

  const refreshWalletAmount = async () => {
    const balance = await getWalletAmount()
    setWalletAmount(balance)
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const value = await getWalletAmount()
      if (mounted && value) {
        setWalletAmount(value)
      }
    })();
    return () => {
      mounted = false
    }
  }, [getWalletAmount])

  return <WalletContext.Provider value={{ walletAmount, refreshWalletAmount }}>{children}</WalletContext.Provider>
}
