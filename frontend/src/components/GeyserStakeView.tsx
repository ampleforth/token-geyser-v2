import { Wallet } from 'ethers';
import React, { useContext, useState } from 'react';
import { MOCK_ERC_20_ADDRESS } from '../constants';
import { GeyserContext } from '../context/GeyserContext';
import { VaultContext } from '../context/VaultContext';
import Web3Context from '../context/Web3Context';
import { approveCreateDepositStake, approveDepositStake, parseUnitsWithDecimals, permitDepositStake } from '../sdk';
import { Input } from '../styling/styles';

interface GeyserStakeViewProps {}

export const GeyserStakeView: React.FC<GeyserStakeViewProps> = () => {
  const [amount, setAmount] = useState<string>('')
  const { selectedGeyser } = useContext(GeyserContext)
  const { signer } = useContext(Web3Context)
  const { selectedVault } = useContext(VaultContext)

  const handleStake = async () => {
    if (selectedGeyser) {
      const parsedAmount = await parseUnitsWithDecimals(amount, MOCK_ERC_20_ADDRESS, signer!)
      const geyserAddress = selectedGeyser.id
      if (selectedVault) {
        const vaultAddress = selectedVault.id
        await approveDepositStake(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
      } else {
        await approveCreateDepositStake(geyserAddress, parsedAmount, signer as Wallet)
      }
    }
  }

  return (
    <div>
      <Input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.currentTarget.value)}
      />
      <button onClick={handleStake}> Stake </button>
    </div>
  );
}
