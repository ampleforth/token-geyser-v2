import { BigNumber, BigNumberish, Wallet } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import React, { useContext, useEffect, useState } from 'react'
import { TransactionReceipt } from '@ethersproject/providers'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { WalletContext } from '../context/WalletContext'
import Web3Context from '../context/Web3Context'
import { approveCreateDepositStake, approveDepositStake } from '../sdk'
import { NamedColors } from '../styling/colors'
import { GeyserInteractionButton, Paragraph } from '../styling/styles'
import { amountOrZero, formatAmount } from '../utils/amount'
import { PositiveInput } from './PositiveInput'

interface Props {}

export const GeyserStakeView: React.FC<Props> = () => {
  const [amount, setAmount] = useState<string>('')
  const [parsedAmount, setParsedAmount] = useState<BigNumber>(BigNumber.from('0'))
  const [receipt, setReceipt] = useState<TransactionReceipt>()
  const { selectedGeyser, stakingTokenInfo } = useContext(GeyserContext)
  const { decimals: stakingTokenDecimals, symbol: stakingTokenSymbol } = stakingTokenInfo
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)

  const userStake = BigNumber.from(amountOrZero(currentLock?.amount))

  const refresh = () => {
    setAmount('')
    setParsedAmount(BigNumber.from('0'))
    refreshWalletAmount()
  }

  useEffect(() => {
    refresh()
  }, [receipt])

  const handleStake = async () => {
    if (selectedGeyser && signer && !parsedAmount.isZero()) {
      const geyserAddress = selectedGeyser.id
      let tx
      if (selectedVault) {
        const vaultAddress = selectedVault.id
        tx = await approveDepositStake(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
      } else {
        tx = await approveCreateDepositStake(geyserAddress, parsedAmount, signer as Wallet)
      }
      setReceipt(await tx.wait())
    }
  }

  const formatDisplayAmount = (amount: BigNumberish) => formatAmount(amount, stakingTokenDecimals, stakingTokenSymbol)

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.currentTarget.value)
    if (selectedGeyser && signer) {
      setParsedAmount(parseUnits(amountOrZero(e.currentTarget.value).toString(), stakingTokenDecimals))
    }
  }

  return (
    <div className="p-4 flex flex-col">
      {parsedAmount.isZero() ? (
        <>
          <div>Wallet balance: {formatDisplayAmount(walletAmount)}</div>
          <div>Current stake: {formatDisplayAmount(userStake)}</div>
        </>
      ) : (
        <>
          <div>New wallet balance: {formatDisplayAmount(walletAmount.sub(parsedAmount))}</div>
          <div>New stake: {formatDisplayAmount(userStake.add(parsedAmount))}</div>
        </>
      )}
      <PositiveInput placeholder="Enter amount" value={amount} onChange={handleOnChange} />
      <GeyserInteractionButton onClick={handleStake}>
        <Paragraph color={NamedColors.WHITE}> Stake </Paragraph>
      </GeyserInteractionButton>
    </div>
  )
}
