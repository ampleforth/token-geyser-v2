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
  const { selectedGeyser } = useContext(GeyserContext)

  const getWalletAmount = useCallback(async () => {
    if (selectedGeyser && signer) {
      const { stakingToken } = selectedGeyser
      try {
        return await ERC20Balance(stakingToken, await signer.getAddress(), signer)
      } catch (e) {
        console.error(e)
        return BigNumber.from('0')
      }
    }
    return BigNumber.from('0')
  }, [selectedGeyser, signer])

  const refreshWalletAmount = () => getWalletAmount()

  useEffect(() => {
    // `mounted` is a workaround for the warning saying that a state update on an unmounted
    // component is not possible: https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
    let mounted = true
    ;(async () => {
      const value = await getWalletAmount()
      if (mounted && value) {
        setWalletAmount(value)
      }
    })()
    return () => {
      mounted = false
    }
  }, [getWalletAmount])

  return <WalletContext.Provider value={{ walletAmount, refreshWalletAmount }}>{children}</WalletContext.Provider>
}
