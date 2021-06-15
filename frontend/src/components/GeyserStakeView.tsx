import { BigNumber } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import React, { useContext, useEffect, useState } from 'react'
import { TransactionReceipt } from '@ethersproject/providers'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { WalletContext } from '../context/WalletContext'
import Web3Context from '../context/Web3Context'
import { amountOrZero } from '../utils/amount'
import { PositiveInput } from './PositiveInput'
import { GeyserInteractionButton } from './GeyserInteractionButton'
import tw from 'twin.macro'
import styled from 'styled-components/macro'
import { WalletBalance } from './WalletBalance'
import { EstimatedRewards } from './EstimatedRewards'
import { ConnectWalletWarning } from './ConnectWalletWarning'

interface Props {}

export const GeyserStakeView: React.FC<Props> = () => {
  const [amount, setAmount] = useState<string>('')
  const [parsedAmount, setParsedAmount] = useState<BigNumber>(BigNumber.from('0'))
  const [receipt, setReceipt] = useState<TransactionReceipt>()
  const { selectedGeyser, stakingTokenInfo, handleGeyserAction, isStakingAction } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol } = stakingTokenInfo
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)
  const { address } = useContext(Web3Context)

  useEffect(() => {
    setAmount('')
    setParsedAmount(BigNumber.from('0'))
    refreshWalletAmount()
  }, [receipt])

  const handleGeyserInteraction = async () => setReceipt(await handleGeyserAction(selectedVault, parsedAmount))

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.currentTarget.value)
    if (selectedGeyser && signer) {
      setParsedAmount(parseUnits(amountOrZero(e.currentTarget.value).toString(), stakingTokenDecimals))
    }
  }

  return (
    <GeyserStakeViewContainer>
      <WalletBalance
        parsedAmount={parsedAmount}
        walletAmount={walletAmount}
        decimals={stakingTokenDecimals}
        symbol={stakingTokenSymbol}
      />
      <PositiveInput placeholder="Enter amount" value={amount} onChange={handleOnChange} />
      <EstimatedRewards />
      {!address && <ConnectWalletWarning />}
      <GeyserInteractionButton onClick={handleGeyserInteraction} displayText={isStakingAction ? `Stake` : `Unstake`} />
    </GeyserStakeViewContainer>
  )
}

const GeyserStakeViewContainer = styled.div`
  min-height: 300px;
  ${tw`m-6 mb-7 flex flex-col`}
`
