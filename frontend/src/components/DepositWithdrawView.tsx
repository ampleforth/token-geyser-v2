import React, { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import VaultsContext from '../context/VaultsContext'
import Web3Context from '../context/Web3Context'
import { depositRawAmount, withdrawRawAmount } from '../sdk'
import { NamedColors } from '../styling/colors'
import { Input, ManageVaultButton, Paragraph } from '../styling/styles'
import { TokenBalance } from '../types'
import { BalanceListItem } from './BalanceListItem'
import { TabPane } from './TabPane'

type Mode = 'Deposit' | 'Withdraw'

interface DepositWithdrawViewProps {
  tokenBalances: TokenBalance[]
}

const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

export const DepositWithdrawView: React.FC<DepositWithdrawViewProps> = ({ tokenBalances }) => {
  // TODO: use better tab system
  const [mode, setMode] = useState<Mode>('Deposit')
  const [amount, setAmount] = useState<string>('')
  const { selectedVault: vault } = useContext(VaultsContext)
  const { signer, address } = useContext(Web3Context)

  const handleTransaction = async () => {
    if (vault && signer && address) {
      if (mode === 'Deposit') {
        await depositRawAmount(vault.id, MOCK_ERC_20_ADDRESS, amount, signer)
      } else {
        await withdrawRawAmount(vault.id, MOCK_ERC_20_ADDRESS, address, amount, signer)
      }
    }
  }

  return (
    <>
      <BalancesContainer>
        {tokenBalances.map((tokenBalance) => <BalanceListItem tokenBalance={tokenBalance} key={tokenBalance.address} />)}
      </BalancesContainer>
      <div>
        <TabPane tabs={['Deposit', 'Withdraw']} onSelect={setMode} />
        <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.currentTarget.value)}/>
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
