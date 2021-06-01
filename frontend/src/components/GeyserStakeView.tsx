import { Wallet } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import { MOCK_ERC_20_ADDRESS } from '../constants';
import { GeyserContext } from '../context/GeyserContext';
import { VaultContext } from '../context/VaultContext';
import Web3Context from '../context/Web3Context';
import { approveCreateDepositStake, approveDepositStake, ERC20Decimals, parseUnitsWithDecimals } from '../sdk';
import { getTokenBalance } from '../sdk/helpers';
import { NamedColors } from '../styling/colors';
import { GeyserInteractionButton, Input, Paragraph } from '../styling/styles';

interface Props {}

export const GeyserStakeView: React.FC<Props> = () => {
  const [amount, setAmount] = useState<string>('')
  const [walletAmount, setWalletAmount] = useState<string>('')
  const { selectedGeyser } = useContext(GeyserContext)
  const { signer } = useContext(Web3Context)
  const { selectedVault } = useContext(VaultContext)

  const getWalletAmount = useCallback(async () => {
    if (signer) {
      try {
        const amt = await getTokenBalance(MOCK_ERC_20_ADDRESS, await signer.getAddress(), signer)
        return formatUnits(amt.toString(), await ERC20Decimals(MOCK_ERC_20_ADDRESS, signer))
      } catch (e) {
        console.error(e)
      }
    }
  }, [signer])

  const refresh = async () => {
    setWalletAmount(await getWalletAmount() || '')
    setAmount('')
  }

  useEffect(() => {
    let mounted = true
    getWalletAmount().then(value => {
      if (mounted) {
        setWalletAmount(value || '')
      }
    })
    return () => { mounted = false }
  }, [getWalletAmount])

  const handleStake = async () => {
    if (selectedGeyser && signer) {
      const parsedAmount = await parseUnitsWithDecimals(amount, MOCK_ERC_20_ADDRESS, signer)
      const geyserAddress = selectedGeyser.id
      let tx
      if (selectedVault) {
        const vaultAddress = selectedVault.id
        tx = await approveDepositStake(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
      } else {
        tx = await approveCreateDepositStake(geyserAddress, parsedAmount, signer as Wallet)
      }
      const receipt = await tx.wait()
      if (receipt) await refresh()
    }
  }

  return (
    <Container className="flex flex-col">
      <div>Wallet: {walletAmount}</div>
      <Input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.currentTarget.value)}
      />
      <GeyserInteractionButton onClick={handleStake}>
        <Paragraph color={NamedColors.WHITE}> Stake </Paragraph>
      </GeyserInteractionButton>
    </Container>
  )
}

const Container = styled.div`
  padding: 16px;
`
