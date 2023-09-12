import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { TransactionReceipt } from '@ethersproject/providers'
import tw from 'twin.macro'
import styled from 'styled-components/macro'
import { useContext, useEffect, useState } from 'react'
import { GeyserAction, TokenInfo } from 'types'
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
import { StakingWarning } from './WrapperWarning'
import { WrapperCheckbox } from './WrapperCheckbox'
import { FormLabel } from '../FormLabel'
import { Select } from '../Select'
import { DisabledInput } from '../DisabledInput'
import {
  WITHDRAW_UNLOCKED_STAKING_TOKENS_WHEN_UNSTAKING,
  WITHDRAW_UNLOCKED_REWARD_TOKENS_WHEN_UNSTAKING,
} from '../../constants'

export const GeyserStakeView = () => {
  const [userInput, setUserInput] = useState('')
  const [parsedUserInput, setParsedUserInput] = useState(BigNumber.from('0'))
  const {
    selectedGeyserInfo: { geyser: selectedGeyser, stakingTokenInfo, rewardTokenInfo, isWrapped, poolAddress },
    handleStakeUnstake,
    handleWrapping,
    geyserAction,
  } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol, address: stakingTokenAddress } = stakingTokenInfo
  const { decimals: rewardTokenDecimals, symbol: rewardTokenSymbol, address: rewardTokenAddress } = rewardTokenInfo
  // const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock, withdrawUnlockedFromVault, rewardAmountClaimedOnUnstake } =
    useContext(VaultContext)
  const { stakingTokenBalance, underlyingTokenBalance, refreshWalletBalances } = useContext(WalletContext)
  const {
    refreshVaultStats,
    vaultStats: { currentStakeable },
  } = useContext(StatsContext)
  const { selectWallet, address } = useContext(Web3Context)
  const currentStakeAmount = BigNumber.from(currentLock ? currentLock.amount : '0')
  const [unstakeConfirmModalOpen, setUnstakeConfirmModalOpen] = useState<boolean>(false)
  const [actualRewardsFromUnstake, setActualRewardsFromUnstake] = useState<BigNumber>(BigNumber.from('0'))
  const [actualStakingTokensFromUnstake, setActualStakingTokensFromUnstake] = useState<BigNumber>(BigNumber.from('0'))
  const [txModalOpen, setTxModalOpen] = useState<boolean>(false)
  const [wrapToken, setWrapToken] = useState<number>(1)
  const [depositToVault, setDepositToVault] = useState<boolean>(false)
  const stakableAmount = stakingTokenBalance.add(currentStakeable)

  const refreshInputAmount = () => {
    setUserInput('')
    setParsedUserInput(BigNumber.from('0'))
  }

  useEffect(() => {
    refreshInputAmount()
  }, [geyserAction])

  const handleGeyserInteraction = () => {
    if (geyserAction === GeyserAction.STAKE) {
      setTxModalOpen(true)
    } else if (geyserAction === GeyserAction.UNSTAKE) {
      setUnstakeConfirmModalOpen(true)
    } else {
      setTxModalOpen(true)
    }
  }

  const handleConfirmUnstake = () => {
    setUnstakeConfirmModalOpen(false)

    // Need to set a timeout before opening a new modal
    // otherwise the overflow-y of the page gets messed up
    setTimeout(() => setTxModalOpen(true), 300)
  }

  const handleOnChange = (value: string, decimals: number) => {
    setUserInput(value)
    if (selectedGeyser) {
      setParsedUserInput(parseUnits(amountOrZero(value).toString(), decimals))
    }
  }

  const onCloseTxModal = async () => {
    setTxModalOpen(false)
    refreshInputAmount()
    await refreshVaultStats()
    await refreshWalletBalances()
  }

  const withdrawStaking = async () => {
    if (WITHDRAW_UNLOCKED_STAKING_TOKENS_WHEN_UNSTAKING) {
      if (withdrawUnlockedFromVault) {
        const tx = await withdrawUnlockedFromVault(stakingTokenAddress)
        if (tx) {
          const { response, amount } = tx
          setActualStakingTokensFromUnstake(amount)
          return response
        }
      }
    } else {
      setActualStakingTokensFromUnstake(parsedUserInput)
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
    }
    if (receipt && rewardAmountClaimedOnUnstake) {
      setActualRewardsFromUnstake(await rewardAmountClaimedOnUnstake(receipt))
    }
    return undefined
  }

  const withdrawStakingTxMessage = (txStateMachine: TxStateMachine) => (
    <WithdrawTxMessage
      txStateMachine={txStateMachine}
      symbol={stakingTokenSymbol}
      amount={formatUnits(actualStakingTokensFromUnstake, stakingTokenDecimals)}
    />
  )

  const withdrawRewardTxMessage = (txStateMachine: TxStateMachine) => (
    <WithdrawTxMessage
      txStateMachine={txStateMachine}
      symbol={rewardTokenSymbol}
      amount={formatUnits(actualRewardsFromUnstake, rewardTokenDecimals)}
    />
  )

  if (geyserAction === GeyserAction.STAKE) {
    return (
      <GeyserStakeViewContainer>
        <UserBalance
          parsedAmount={parsedUserInput}
          currentAmount={stakableAmount}
          decimals={stakingTokenDecimals}
          symbol={stakingTokenSymbol}
          isStakingAction
          poolAddress={poolAddress}
        />
        <PositiveInput
          placeholder="Enter amount"
          value={userInput}
          onChange={(n) => handleOnChange(n, stakingTokenDecimals)}
          precision={stakingTokenDecimals}
          maxValue={stakableAmount}
          skipMaxEnforcement
        />
        {isWrapped ? <StakingWarning /> : null}
        <EstimatedRewards parsedUserInput={parsedUserInput} />
        {!address && <ConnectWalletWarning onClick={selectWallet} />}
        <GeyserInteractionButton
          disabled={!address || parsedUserInput.isZero() || parsedUserInput.gt(stakableAmount)}
          onClick={handleGeyserInteraction}
          displayText="Stake"
        />
        <SingleTxModal
          submit={() => handleStakeUnstake(selectedVault, parsedUserInput)}
          txSuccessMessage={
            <span>
              Successfully staked{' '}
              <b>
                {userInput} {stakingTokenSymbol}
              </b>
              .
            </span>
          }
          open={txModalOpen}
          onClose={onCloseTxModal}
        />
      </GeyserStakeViewContainer>
    )
  } else if (geyserAction === GeyserAction.UNSTAKE) {
    return (
      <GeyserStakeViewContainer>
        <UserBalance
          parsedAmount={parsedUserInput}
          currentAmount={currentStakeAmount}
          decimals={stakingTokenDecimals}
          symbol={stakingTokenSymbol}
          isStakingAction={false}
          poolAddress={poolAddress}
        />
        <PositiveInput
          placeholder="Enter amount"
          value={userInput}
          onChange={(n) => handleOnChange(n, stakingTokenDecimals)}
          precision={stakingTokenDecimals}
          maxValue={currentStakeAmount}
        />
        <UnstakeSummary userInput={userInput} parsedUserInput={parsedUserInput} />
        {!address && <ConnectWalletWarning onClick={selectWallet} />}
        <GeyserInteractionButton
          disabled={!address || parsedUserInput.isZero()}
          onClick={handleGeyserInteraction}
          displayText="Unstake"
        />
        <UnstakeConfirmModal
          parsedUserInput={parsedUserInput}
          open={unstakeConfirmModalOpen}
          onClose={() => setUnstakeConfirmModalOpen(false)}
          onConfirm={handleConfirmUnstake}
        />
        <UnstakeTxModal
          open={txModalOpen}
          unstake={() => handleStakeUnstake(selectedVault, parsedUserInput)}
          unstakeSuccessMessage={
            <span>
              Successfully unstaked{' '}
              <b>
                {userInput} {stakingTokenSymbol}
              </b>
              .
            </span>
          }
          onClose={onCloseTxModal}
          withdrawStaking={withdrawStaking}
          withdrawStakingTxMessage={withdrawStakingTxMessage}
          withdrawReward={withdrawReward}
          withdrawRewardTxMessage={withdrawRewardTxMessage}
        />
      </GeyserStakeViewContainer>
    )
  }

  const underlyingTokenInfo = stakingTokenInfo.wrappedToken as TokenInfo
  const tokenOptions = [
    { id: stakingTokenInfo.address, name: `${stakingTokenInfo.name} (${stakingTokenInfo.symbol})` },
    { id: underlyingTokenInfo.address, name: `${underlyingTokenInfo.name} (${underlyingTokenInfo.symbol})` },
  ]

  // wrapToken == 0 from: ubAToken to aToken (unwrap)
  // wrapToken == 1 from: aToken to ubAToken (wrap)
  const isWrap = wrapToken === 1
  const wrapBalance = isWrap ? underlyingTokenBalance : stakingTokenBalance
  const wrapDecimals = isWrap ? underlyingTokenInfo.decimals : stakingTokenInfo.decimals
  const wrapSymbol = isWrap ? underlyingTokenInfo.symbol : stakingTokenInfo.symbol
  return (
    <GeyserStakeViewContainer>
      <FormLabel text="From" />
      <Select
        options={tokenOptions}
        onChange={(t) => {
          refreshInputAmount()
          setWrapToken(t)
        }}
        selected={wrapToken}
      />

      <FormLabel text="To" />
      <DisabledInput value={tokenOptions[1 - wrapToken].name} />

      <FormLabel text="Amount" />
      <PositiveInput
        placeholder="Enter amount"
        value={userInput}
        onChange={(n) => handleOnChange(n, wrapDecimals)}
        precision={wrapDecimals}
        maxValue={wrapBalance}
      />

      {isWrap ? <WrapperCheckbox checked={depositToVault} onChange={setDepositToVault} /> : null}

      <GeyserInteractionButton
        disabled={!address || parsedUserInput.isZero()}
        onClick={handleGeyserInteraction}
        displayText={isWrap ? 'Wrap' : 'Unwrap'}
      />

      <SingleTxModal
        submit={() =>
          handleWrapping(
            stakingTokenInfo.address,
            underlyingTokenInfo.address,
            parsedUserInput,
            isWrap,
            selectedVault,
            depositToVault,
          )
        }
        txSuccessMessage={
          <span>
            Successfully {isWrap ? 'wrapped' : 'unwrapped'}{' '}
            <b>
              {userInput} {wrapSymbol}
            </b>
            .
          </span>
        }
        open={txModalOpen}
        onClose={onCloseTxModal}
      />
    </GeyserStakeViewContainer>
  )
}

const GeyserStakeViewContainer = styled.div`
  ${tw`m-6 mb-7 min-h-300px flex flex-col`}
`
