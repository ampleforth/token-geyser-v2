import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { TransactionReceipt } from '@ethersproject/providers'
import tw from 'twin.macro'
import styled from 'styled-components/macro'
import { useContext, useEffect, useState } from 'react'
import { GeyserContext } from 'context/GeyserContext'
import { VaultContext } from 'context/VaultContext'
import { WalletContext } from 'context/WalletContext'
import Web3Context from 'context/Web3Context'
import { TxStateMachine } from 'hooks/useTxStateMachine'
import { amountOrZero } from 'utils/amount'
import { PositiveInput } from './PositiveInput'
import { GeyserInteractionButton } from './GeyserInteractionButton'
import { UserBalance } from './UserBalance'
import { EstimatedRewards } from './EstimatedRewards'
import { ConnectWalletWarning } from './ConnectWalletWarning'
import { UnstakeSummary } from './UnstakeSummary'
import { UnstakeConfirmModal } from './UnstakeConfirmModal'
import { SingleTxModal } from './SingleTxModal'
import { UnstakeTxModal } from './UnstakeTxModal'
import { WithdrawTxMessage } from './WithdrawTxMessage'

interface Props {}

export const GeyserStakeView: React.FC<Props> = () => {
  const [userInput, setUserInput] = useState('')
  const [parsedUserInput, setParsedUserInput] = useState(BigNumber.from('0'))
  const { selectedGeyser, stakingTokenInfo, rewardTokenInfo, handleGeyserAction, isStakingAction } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol, address: stakingTokenAddress } = stakingTokenInfo
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol } = rewardTokenInfo
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock, withdrawFromVault, withdrawRewardsFromVault } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)
  const { selectWallet, address } = useContext(Web3Context)
  const currentStakeAmount = BigNumber.from(currentLock ? currentLock.amount : '0')
  const [unstakeConfirmModalOpen, setUnstakeConfirmModalOpen] = useState<boolean>(false)
  const [actualRewardsFromUnstake, setActualRewardsFromUnstake] = useState<BigNumber>(BigNumber.from('0'))

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
  }

  const withdrawStaking = async () => {
    if (withdrawFromVault)
      return withdrawFromVault(stakingTokenAddress, parsedUserInput)
    return undefined
  }

  const withdrawReward = async (receipt?: TransactionReceipt) => {
    if (receipt && withdrawRewardsFromVault) {
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
    <WithdrawTxMessage txStateMachine={txStateMachine} symbol={stakingTokenSymbol} amount={userInput} />
  )

  const withdrawRewardTxMessage = (txStateMachine: TxStateMachine) => (
    <WithdrawTxMessage txStateMachine={txStateMachine} symbol={rewardTokenSymbol} amount={formatUnits(actualRewardsFromUnstake, rewardTokenDecimals)} />
  )

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
