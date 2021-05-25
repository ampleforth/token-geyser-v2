import { Wallet } from '@ethersproject/wallet'
import React, { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import { GeyserAction } from '../constants'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import Web3Context from '../context/Web3Context'
import { stakeRawAmount, unstakeRawAmount } from '../sdk'
import { NamedColors } from '../styling/colors'
import { Input, ManageVaultButton, Paragraph, VaultInfoMessage } from '../styling/styles'
import { StakeListItem } from './StakeListItem'
import { ToggleView } from './ToggleView'

export const StakeUnstakeView: React.FC = () => {
  const { selectedVault: vault } = useContext(VaultContext)
  const { geysers } = useContext(GeyserContext)

  const [mode, setMode] = useState<GeyserAction>(GeyserAction.STAKE)
  const getToggleOptions = () => Object.values(GeyserAction).map((view) => view.toString())
  const selectView = (option: string) => setMode(GeyserAction[option as keyof typeof GeyserAction])

  const [amount, setAmount] = useState<string>('')
  const [selectedGeyser] = useState<string>(geysers.length > 0 ? geysers[0].id : '')
  const { signer, address } = useContext(Web3Context)

  const handleTransaction = async () => {
    if (vault && signer && address && selectedGeyser) {
      if (mode === GeyserAction.STAKE) {
        await stakeRawAmount(selectedGeyser, vault.id, amount, signer as Wallet)
      } else {
        await unstakeRawAmount(selectedGeyser, vault.id, amount, signer as Wallet)
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
        <ToggleView options={getToggleOptions()} toggleOption={selectView} activeOption={mode.toString()} />
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
