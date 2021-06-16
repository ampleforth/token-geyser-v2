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
import { UserBalance } from './UserBalance'
import { EstimatedRewards } from './EstimatedRewards'
import { ConnectWalletWarning } from './ConnectWalletWarning'
import { UnstakeSummary } from './UnstakeSummary'
import { UnstakeConfirmModal } from './UnstakeConfirmModal'

interface Props {}

export const GeyserStakeView: React.FC<Props> = () => {
  const [userInput, setUserInput] = useState('')
  const [parsedUserInput, setParsedUserInput] = useState(BigNumber.from('0'))
  const [receipt, setReceipt] = useState<TransactionReceipt>()
  const { selectedGeyser, stakingTokenInfo, handleGeyserAction, isStakingAction } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol } = stakingTokenInfo
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)
  const { selectWallet, address } = useContext(Web3Context)
  const currentStakeAmount = BigNumber.from(currentLock ? currentLock.amount : '0')
  const [unstakeConfirmModalOpen, setUnstakeConfirmModalOpen] = useState<boolean>(false)

  const refreshInputAmount = () => {
    setUserInput('')
    setParsedUserInput(BigNumber.from('0'))
  }

  useEffect(() => {
    refreshInputAmount()
    refreshWalletAmount()
  }, [receipt])

  useEffect(() => {
    refreshInputAmount()
  }, [isStakingAction])

  const handleGeyserInteraction = async () => {
    if (isStakingAction) {
      setReceipt(await handleGeyserAction(selectedVault, parsedUserInput))
    } else {
      setUnstakeConfirmModalOpen(true)
    }
  }

  const handleConfirmUnstake = async () => {
    setReceipt(await handleGeyserAction(selectedVault, parsedUserInput))
    setUnstakeConfirmModalOpen(false)
  }

  const handleOnChange = (value: string) => {
    setUserInput(value)
    if (selectedGeyser && signer) {
      setParsedUserInput(parseUnits(amountOrZero(value).toString(), stakingTokenDecimals))
    }
  }

  return (
    <GeyserStakeViewContainer>
      <UserBalance
        parsedAmount={parsedUserInput}
        currentAmount={isStakingAction ? walletAmount : currentStakeAmount}
        decimals={stakingTokenDecimals}
        symbol={stakingTokenSymbol}
        isStakingAction={isStakingAction}
      />
      <PositiveInput
        placeholder="Enter amount"
        value={userInput}
        onChange={handleOnChange}
        precision={stakingTokenDecimals}
        maxValue={isStakingAction ? walletAmount : currentStakeAmount}
      />
      {isStakingAction
        ? <EstimatedRewards parsedUserInput={parsedUserInput} />
        : <UnstakeSummary userInput={userInput} parsedUserInput={parsedUserInput} />}
      {!address && <ConnectWalletWarning onClick={selectWallet} />}
      <GeyserInteractionButton
        disabled={!address || parsedUserInput.isZero()}
        onClick={handleGeyserInteraction}
        displayText={isStakingAction ? `Stake` : `Unstake`}
      />
      {!isStakingAction && <UnstakeConfirmModal parsedUserInput={parsedUserInput} open={unstakeConfirmModalOpen} onClose={() => setUnstakeConfirmModalOpen(false)} onConfirm={handleConfirmUnstake}/>}
    </GeyserStakeViewContainer>
  )
}

const GeyserStakeViewContainer = styled.div`
  ${tw`m-6 mb-7 min-h-300px flex flex-col`}
`
