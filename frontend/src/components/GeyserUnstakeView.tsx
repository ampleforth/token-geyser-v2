import { BigNumber, BigNumberish, Wallet } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import React, { useContext, useState } from 'react'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { WalletContext } from '../context/WalletContext'
import Web3Context from '../context/Web3Context'
import { unstakeWithdraw } from '../sdk'
import { NamedColors } from '../styling/colors'
import { GeyserInteractionButton, Paragraph } from '../styling/styles'
import { amountOrZero, formatAmount } from '../utils/amount'
import { PositiveInput } from './PositiveInput'

interface Props {}

export const GeyserUnstakeView: React.FC<Props> = () => {
  const [amount, setAmount] = useState<string>('')
  const [parsedAmount, setParsedAmount] = useState<BigNumber>(BigNumber.from('0'))
  const { selectedGeyser, stakingTokenDecimals, stakingTokenSymbol } = useContext(GeyserContext)
  const { signer } = useContext(Web3Context)
  const { selectedVault, currentLock } = useContext(VaultContext)
  const { walletAmount, refreshWalletAmount } = useContext(WalletContext)

  const userStake = BigNumber.from(amountOrZero(currentLock?.amount))

  const refresh = () => {
    setAmount('')
    setParsedAmount(BigNumber.from('0'))
    refreshWalletAmount()
  }

  const handleUnstake = async () => {
    if (selectedGeyser && selectedVault && signer) {
      const geyserAddress = selectedGeyser.id
      const vaultAddress = selectedVault.id
      const tx = await unstakeWithdraw(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
      const receipt = await tx.wait()
      if (receipt) refresh()
    }
  }

  const formatDisplayAmount = (amount: BigNumberish) => (
    formatAmount(amount, stakingTokenDecimals, stakingTokenSymbol)
  )

  return (
    <div className="p-4 flex flex-col">
      {parsedAmount.isZero()
        ? <>
            <div>Wallet balance: {formatDisplayAmount(walletAmount)}</div>
            <div>Current stake: {formatDisplayAmount(userStake)}</div>
          </>
        : <>
            <div>New wallet balance: {formatDisplayAmount(walletAmount.add(parsedAmount))}</div>
            <div>New stake: {formatDisplayAmount(userStake.sub(parsedAmount))}</div>
          </>}
      <PositiveInput
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => {
          setAmount(e.currentTarget.value)
          if (selectedGeyser && signer) {
            setParsedAmount(parseUnits(amountOrZero(e.currentTarget.value).toString(), stakingTokenDecimals))
          }
        }}
      />
      <GeyserInteractionButton onClick={handleUnstake}>
        <Paragraph color={NamedColors.WHITE}> Unstake </Paragraph>
      </GeyserInteractionButton>
    </div>
  );
}
