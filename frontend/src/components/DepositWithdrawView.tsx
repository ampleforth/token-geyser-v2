import React, { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import { MOCK_ERC_20_ADDRESS, VaultAction } from '../constants'
import { VaultContext } from '../context/VaultContext'
import Web3Context from '../context/Web3Context'
import { depositRawAmount, withdrawRawAmount } from '../sdk'
import { NamedColors } from '../styling/colors'
import { Input, ManageVaultButton, Paragraph } from '../styling/styles'
import { TokenBalance } from '../types'
import { BalanceListItem } from './BalanceListItem'
import { ToggleView } from './ToggleView'
import { TransactionResponse } from '@ethersproject/providers'

interface DepositWithdrawViewProps {
  tokenBalances: TokenBalance[]
}

export const DepositWithdrawView: React.FC<DepositWithdrawViewProps> = ({ tokenBalances }) => {

  const [mode, setMode] = useState<VaultAction>(VaultAction.DEPOSIT)
  const getToggleOptions = () => Object.values(VaultAction).map((view) => view.toString())
  const selectView = (option: string) => setMode(VaultAction[option as keyof typeof VaultAction])

  const [amount, setAmount] = useState<string>('')
  const { selectedVault: vault } = useContext(VaultContext)
  const { signer, address } = useContext(Web3Context)

  const refreshPage = (transactionResponse: TransactionResponse) => {
    const receipt = transactionResponse.wait()
    if (receipt) {
      window.location.reload()
      localStorage.setItem('persistSelectedVault', 'true')
    }
  }

  const handleTransaction = async () => {
    if (vault && signer && address) {
      if (mode === VaultAction.DEPOSIT) {
        const depositResponse = await depositRawAmount(vault.id, MOCK_ERC_20_ADDRESS, amount, signer)
        refreshPage(depositResponse)
      } else {
        const withdrawResponse = await withdrawRawAmount(vault.id, MOCK_ERC_20_ADDRESS, address, amount, signer)
        refreshPage(withdrawResponse)
      }
    }
  }

  return (
    <>
      <BalancesContainer>
        {tokenBalances.map((tokenBalance) => (
          <BalanceListItem tokenBalance={tokenBalance} key={tokenBalance.address} />
        ))}
      </BalancesContainer>
      <div>
        <ToggleView options={getToggleOptions()} toggleOption={selectView} activeOption={mode.toString()} />
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.currentTarget.value)}
        />
        {/* TODO: button to select which token */}
        <ManageVaultButton onClick={handleTransaction}>
          <Paragraph color={NamedColors.WHITE}>{mode}</Paragraph>
        </ManageVaultButton>
      </div>
    </>
  )
}

const BalancesContainer = styled.div`
  padding: 20px;
  overflow-y: hidden;
  :hover {
    overflow-y: overlay;
  }
`
