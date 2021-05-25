import React, { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import Web3Context from '../context/Web3Context'
import { stakeRawAmount, unstakeRawAmount } from '../sdk'
import { NamedColors } from '../styling/colors'
import { Input, ManageVaultButton, Paragraph, VaultInfoMessage } from '../styling/styles'
import { StakeListItem } from './StakeListItem'

type Mode = 'Stake' | 'Unstake'

export const StakeUnstakeView: React.FC= () => {
  // TODO: use better tab system
  const { selectedVault: vault } = useContext(VaultContext)
  const { geysers } = useContext(GeyserContext)
  const [mode, setMode] = useState<Mode>('Stake')
  const [amount, setAmount] = useState<string>('')
  const [selectedGeyser] = useState<string>(geysers.length > 0 ? geysers[0].id : '')
  const { signer, address } = useContext(Web3Context)

  const handleTransaction = async () => {
    if (vault && signer && address && selectedGeyser) {
      if (mode === 'Stake') {
        await stakeRawAmount(selectedGeyser, vault.id, amount, signer as any)
      } else {
        await unstakeRawAmount(selectedGeyser, vault.id, amount, signer as any)
      }
    }
  }

  return (
    <>
      {vault && vault.locks.length > 0 ? (
        <StakesContainer>
          {vault?.locks.map((lock) => (
            <StakeListItem lock={lock} />
          ))}
        </StakesContainer>
      ) : (
        <VaultInfoMessage>No stakes yet</VaultInfoMessage>
      )}
      <div>
        {/* <TabPane tabs={['Stake', 'Unstake']} onSelect={setMode} /> */}
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.currentTarget.value)}
        />
        {/* TODO: button to select geyser */}
        <ManageVaultButton onClick={handleTransaction}>
          <Paragraph color={NamedColors.WHITE}>{mode}</Paragraph>
        </ManageVaultButton>
      </div>
    </>
  )
}

const StakesContainer = styled.div`
  padding: 20px;
  overflow-y: hidden;
  :hover {
    overflow-y: overlay;
  }
`
