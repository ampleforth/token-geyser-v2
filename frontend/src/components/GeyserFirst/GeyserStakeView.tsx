import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { TransactionReceipt } from '@ethersproject/providers'
import tw from 'twin.macro'
import styled from 'styled-components/macro'
import { useContext, useEffect, useState } from 'react'
import { GeyserContext } from 'context/GeyserContext'
import { VaultContext } from 'context/VaultContext'
import { WalletContext } from 'context/WalletContext'
import { StatsContext } from 'context/StatsContext'
import Web3Context from 'context/Web3Context'
import { TxStateMachine } from 'hooks/useTxStateMachine'
import { amountOrZero } from 'utils/amount'
import { PositiveInput } from 'components/PositiveInput'
import { SingleTxModal } from 'components/SingleTxModal'
import { GeyserInteractionButton } from './GeyserInteractionButton'
import { UserBalance } from './UserBalance'
import { EstimatedRewards } from './EstimatedRewards'
import { ConnectWalletWarning } from './ConnectWalletWarning'
import { UnstakeSummary } from './UnstakeSummary'
import { UnstakeConfirmModal } from './UnstakeConfirmModal'
import { UnstakeTxModal } from './UnstakeTxModal'
import { WithdrawTxMessage } from './WithdrawTxMessage'
import {
  WITHDRAW_UNLOCKED_STAKING_TOKENS_WHEN_UNSTAKING,
  WITHDRAW_UNLOCKED_REWARD_TOKENS_WHEN_UNSTAKING,
} from '../../constants'

export const GeyserStakeView = () => {
  const [userInput, setUserInput] = useState('')
  const [parsedUserInput, setParsedUserInput] = useState(BigNumber.from('0'))
  const { selectedGeyserInfo: { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo }, handleGeyserAction, isStakingAction } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol, address: stakingTokenAddress } = stakingTokenInfo
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol, address: rewardTokenAddress } = rewardTokenInfo
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock, withdrawFromVault, withdrawRewardsFromVault, withdrawUnlockedFromVault } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)
  const { refreshVaultStats, vaultStats: {currentStakable} } = useContext(StatsContext)
  const { selectWallet, address } = useContext(Web3Context)
  const currentStakeAmount = BigNumber.from(currentLock ? currentLock.amount : '0')
  const [unstakeConfirmModalOpen, setUnstakeConfirmModalOpen] = useState<boolean>(false)
  const [actualRewardsFromUnstake, setActualRewardsFromUnstake] = useState<BigNumber>(BigNumber.from('0'))
  const [actualStakingTokensFromUnstake, setActualStakingTokensFromUnstake] = useState<BigNumber>(BigNumber.from('0'))

  const [txModalOpen, setTxModalOpen] = useState<boolean>(false)

  const refreshInputAmount = () => {
    setUserInput('')
    setParsedUserInput(BigNumber.from('0'))
  }

  useEffect(() => {
    refreshInputAmount()
  }, [isStakingAction])

  const handleGeyserInteraction = () => {
    (isStakingAction ? setTxModalOpen : setUnstakeConfirmModalOpen)(true)
  }

  const handleConfirmUnstake = () => {
    setUnstakeConfirmModalOpen(false)

    // Need to set a timeout before opening a new modal
    // otherwise the overflow-y of the page gets messed up
    setTimeout(() => setTxModalOpen(true), 300)
  }

  const handleOnChange = (value: string) => {
    setUserInput(value)
    if (selectedGeyser && signer) {
      setParsedUserInput(parseUnits(amountOrZero(value).toString(), stakingTokenDecimals))
    }
  }

  const onCloseTxModal = () => {
    setTxModalOpen(false)
    refreshInputAmount()
    refreshWalletAmount()
    refreshVaultStats()
  }

  const withdrawStaking = async () => {
    if (WITHDRAW_UNLOCKED_STAKING_TOKENS_WHEN_UNSTAKING) {
      if (withdrawUnlockedFromVault) {
        const tx = await withdrawUnlockedFromVault(stakingTokenAddress)
        if (tx) {
          const { response, amount } = tx
          console.log(amount.toString())
          setActualStakingTokensFromUnstake(amount)
          return response
        }
      }
    } else if (withdrawFromVault) {
      setActualStakingTokensFromUnstake(parsedUserInput)
      return withdrawFromVault(stakingTokenAddress, parsedUserInput)
    }
    return undefined
  }

  const withdrawReward = async (receipt?: TransactionReceipt) => {
    if (WITHDRAW_UNLOCKED_REWARD_TOKENS_WHEN_UNSTAKING) {
      if (withdrawUnlockedFromVault) {
        const tx = await withdrawUnlockedFromVault(rewardTokenAddress)
        if (tx) {
          const { response, amount } = tx
          setActualRewardsFromUnstake(amount)
          return response
        }
      }
    } else if (receipt && withdrawRewardsFromVault) {
      const tx = await withdrawRewardsFromVault(receipt)
      if (tx) {
        const { response, rewards } = tx
        setActualRewardsFromUnstake(rewards)
        return response
      }
    }
    return undefined
  }

  const withdrawStakingTxMessage = (txStateMachine: TxStateMachine) => (
    <WithdrawTxMessage txStateMachine={txStateMachine} symbol={stakingTokenSymbol} amount={formatUnits(actualStakingTokensFromUnstake, stakingTokenDecimals)} />
  )

  const withdrawRewardTxMessage = (txStateMachine: TxStateMachine) => (
    <WithdrawTxMessage txStateMachine={txStateMachine} symbol={rewardTokenSymbol} amount={formatUnits(actualRewardsFromUnstake, rewardTokenDecimals)} />
  )

  const stakableAmount = walletAmount.add(currentStakable)

  return (
    <GeyserStakeViewContainer>
      <UserBalance
        parsedAmount={parsedUserInput}
        currentAmount={isStakingAction ? stakableAmount : currentStakeAmount}
        decimals={stakingTokenDecimals}
        symbol={stakingTokenSymbol}
        isStakingAction={isStakingAction}
      />
      <PositiveInput
        placeholder="Enter amount"
        value={userInput}
        onChange={handleOnChange}
        precision={stakingTokenDecimals}
        maxValue={isStakingAction ? stakableAmount : currentStakeAmount}
        skipMaxEnforcement={isStakingAction}
      />
      {isStakingAction ? (
        <EstimatedRewards parsedUserInput={parsedUserInput} />
      ) : (
        <UnstakeSummary userInput={userInput} parsedUserInput={parsedUserInput} />
      )}
      {!address && <ConnectWalletWarning onClick={selectWallet} />}
      <GeyserInteractionButton
        disabled={!address || parsedUserInput.isZero()}
        onClick={handleGeyserInteraction}
        displayText={isStakingAction ? `Stake` : `Unstake`}
      />
      {!isStakingAction && (
        <UnstakeConfirmModal
          parsedUserInput={parsedUserInput}
          open={unstakeConfirmModalOpen}
          onClose={() => setUnstakeConfirmModalOpen(false)}
          onConfirm={handleConfirmUnstake}
        />
      )}
      {isStakingAction ? (
        <SingleTxModal
          submit={() => handleGeyserAction(selectedVault, parsedUserInput)}
          txSuccessMessage={<span>Successfully staked <b>{userInput} {stakingTokenSymbol}</b>.</span>}
          open={txModalOpen}
          onClose={onCloseTxModal}
        />
      ) : (
        <UnstakeTxModal
          open={txModalOpen}
          unstake={() => handleGeyserAction(selectedVault, parsedUserInput)}
          unstakeSuccessMessage={<span>Successfully unstaked <b>{userInput} {stakingTokenSymbol}</b>.</span>}
          onClose={onCloseTxModal}
          withdrawStaking={withdrawStaking}
          withdrawStakingTxMessage={withdrawStakingTxMessage}
          withdrawReward={withdrawReward}
          withdrawRewardTxMessage={withdrawRewardTxMessage}
        />
      )}
    </GeyserStakeViewContainer>
  )
}

const GeyserStakeViewContainer = styled.div`
  ${tw`m-6 mb-7 min-h-300px flex flex-col`}
`
