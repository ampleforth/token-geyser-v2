import React, { useContext, useEffect, useState } from 'react'
import Web3Context from '../context/Web3Context'
import styled from 'styled-components/macro'
import { BigVaultFirstOverlay, VaultFirstTitle } from '../styling/styles'
import { BigNumber, BigNumberish } from 'ethers'
import { getTokenBalances } from '../sdk/helpers'
import { deposit } from '../sdk'
import VaultsContext from '../context/VaultsContext'
import { DepositWithdrawView } from './DepositWithdrawView'
import { TokenBalance } from '../types'

interface TokenMetaData {
  address: string
  name: string
}

interface Props {}

const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

export const ManageVault: React.FC<Props> = () => {
  const { signer } = useContext(Web3Context)
  const { selectedVault } = useContext(VaultsContext)
  const vault = selectedVault!

  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [tokenMetaData] = useState<TokenMetaData[]>(Array(5).fill(({ address: MOCK_ERC_20_ADDRESS, name: 'MockERC20' })))

  // To control the view switch between stake/unstake and deposit/withdraw
  const [showStakeView, setShowStakeView] = useState<boolean>(false)

  const toggleShowStakeView = () => setShowStakeView(!showStakeView)

  const getBalances = async () => {
    try {
      if (signer) {
        const balances = await getTokenBalances(tokenMetaData.map(token => token.address), vault.id, signer)
        setTokenBalances(
          balances.map((balance, index) => ({ balance, metadata: tokenMetaData[index] }))
            .filter(value => value.balance.status === 'fulfilled')
            .map(value => ({...value.metadata, balance: (value.balance as PromiseFulfilledResult<BigNumber>).value }))
        )
      }
    } catch (e) {
      console.error(`Error`, e)
    }
  }

  // TODO: Cleanup
  useEffect(() => {
    getBalances()
  }, [tokenMetaData, signer, vault.id])

  return (
    <>
      <VaultFirstTitle>Balances</VaultFirstTitle>
      <Note>ID: {vault.id}</Note>
      <BigVaultFirstOverlay>
        {/* Toggle buttons go here */}
        {showStakeView ? <>In Progress</> : <DepositWithdrawView tokenBalances={tokenBalances} />}
      </BigVaultFirstOverlay>
    </>
  )
}

const Note = styled.h3`
  font-size: 1rem;
  color: grey
`
