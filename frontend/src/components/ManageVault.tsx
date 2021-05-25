import React, { useContext, useEffect, useState } from 'react'
import Web3Context from '../context/Web3Context'
import styled from 'styled-components/macro'
import { VaultMetaData } from '../types'
import { Paragraph, VaultFirstOverlay, VaultFirstTitle } from '../styling/styles'
import { BigNumber, BigNumberish } from 'ethers'
import { getTokenBalances } from '../sdk/helpers'
import { deposit } from '../sdk'
import { NamedColors } from '../styling/colors'

interface Props {
  vault: VaultMetaData
}

const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

export const ManageVault: React.FC<Props> = ({ vault }) => {
  const { signer } = useContext(Web3Context)
  const [balances, setBalances] = useState<BigNumber[]>([])
  const [tokenAddresses] = useState<string[]>(Array(5).fill(MOCK_ERC_20_ADDRESS))

  // To control the view switch between stake/unstake and deposit/withdraw
  const [showStakeView, setShowStakeView] = useState<boolean>(false)

  const toggleShowStakeView = () => setShowStakeView(!showStakeView)

  // TODO
  const handleDeposit = (amount: BigNumberish) => {
    try {
      if (signer) {
        const transactionResponse = deposit(vault.id, MOCK_ERC_20_ADDRESS, amount.toString(), signer)
        console.log(JSON.stringify(transactionResponse))
      }
    } catch (e) {
      console.error(`Error`, e)
    }
  }

  // TODO: Cleanup
  useEffect(() => {
    ;(async () => {
      try {
        if (signer) {
          const tokenBalances = await getTokenBalances(tokenAddresses, vault.id, signer)
          setBalances(tokenBalances.map((balance) => (balance as PromiseFulfilledResult<BigNumber>).value))
        }
      } catch (e) {
        console.error(`Error`, e)
      }
    })()
  }, [tokenAddresses, signer, vault.id])

  return (
    <>
      <VaultFirstTitle>Select a vault</VaultFirstTitle>
      <VaultFirstOverlay>
        {/* Toggle buttons go here */}
        {showStakeView ? <>In Progress</> : <DepositWithdrawView balances={balances} />}
      </VaultFirstOverlay>
    </>
  )
}

interface DepositWithdrawViewProps {
  balances: BigNumber[]
}

const DepositWithdrawView: React.FC<DepositWithdrawViewProps> = ({ balances }) => {
  return (
    <>
      {balances.map((balance) => JSON.stringify(balance))}
      <ButtonsContainer>
        <ManageVaultButton>
          <Paragraph color={NamedColors.WHITE}>Deposit</Paragraph>
        </ManageVaultButton>
        <ManageVaultButton>
          <Paragraph color={NamedColors.WHITE}>Withdraw</Paragraph>
        </ManageVaultButton>
      </ButtonsContainer>
    </>
  )
}

const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: auto;
`

const ManageVaultButton = styled.button`
  cursor: pointer;
  width: 90%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin: auto;
  border: 1px solid ${NamedColors.WHITE};
  background-color: ${NamedColors.ELECTRICAL_VIOLET};
  :hover {
    background-color: ${NamedColors.RADICAL_RED};
  }
`
