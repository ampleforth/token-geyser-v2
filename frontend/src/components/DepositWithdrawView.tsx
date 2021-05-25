import React, { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import VaultsContext from '../context/VaultsContext'
import Web3Context from '../context/Web3Context'
import { depositRawAmount, withdrawRawAmount } from '../sdk'
import { NamedColors } from '../styling/colors'
import { Paragraph } from '../styling/styles'
import { TokenBalance } from '../types'
import BalanceListItem from './BalanceListItem'

type Mode = 'deposit' | 'withdraw'

interface DepositWithdrawViewProps {
  tokenBalances: TokenBalance[]
}

const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

export const DepositWithdrawView: React.FC<DepositWithdrawViewProps> = ({ tokenBalances }) => {
  // TODO: use tab system
  const [mode, setMode] = useState<Mode>('deposit')
  const [amount, setAmount] = useState<string>('')
  const { selectedVault: vault } = useContext(VaultsContext)
  const { signer, address } = useContext(Web3Context)

  const handleTransaction = async () => {
    if (vault && signer && address) {
      if (mode === 'deposit') {
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
        <ButtonsContainer>
          <Tab selected={mode === 'deposit'} onClick={() => setMode('deposit')}>Deposit</Tab>
          <Tab selected={mode === 'withdraw'} onClick={() => setMode('withdraw')}>Withdraw</Tab>
        </ButtonsContainer>
        <Input type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.currentTarget.value)}/>
        {/* TODO: button to select which token */}
        <ManageVaultButton onClick={handleTransaction}>
          <Paragraph color={NamedColors.WHITE}>{mode === 'deposit' ? 'Deposit' : 'Withdraw'}</Paragraph>
        </ManageVaultButton>
      </div>
    </>
  )
}

interface TabProps {
  selected: boolean
  onClick: () => void
}

const Tab: React.FC<TabProps> = ({ children, selected, onClick }) => {
  return (
    <TabButton onClick={onClick} color={selected ? NamedColors.BLACK : NamedColors.WHITE}>
      <Paragraph color={selected ? NamedColors.WHITE : NamedColors.BLACK}>
        {children}
      </Paragraph>
    </TabButton>
  )
}

const Input = styled.input`
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-outer-spin-button{
    -webkit-appearance: none;
    margin: 0;
  }
  width: 75%;
  box-sizing: border-box;
  padding: 12px 10px;
  font-size: bold;
  text-indent: 10px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  border-radius: 5px;
  border: 1px solid #ddd;
  font-size: 1.2rem;
  height: 60px;
  margin: 16px;
`

const BalancesContainer = styled.div`
  padding: 20px;
  overflow-y: hidden;
  :hover {
    overflow-y: overlay;
  }
`

const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-left: 20%;
  margin-right: 20%;
`

const ManageVaultButton = styled.button`
  cursor: pointer;
  width: 50%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid ${NamedColors.WHITE};
  background-color: ${NamedColors.ELECTRICAL_VIOLET};
  :hover {
    background-color: ${NamedColors.RADICAL_RED};
  }
`

const TabButton = styled.button`
  cursor: pointer;
  width: 90%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin: auto;
  border: 1px solid ${NamedColors.BLACK};
  background-color: ${(props) => props.color};
`
