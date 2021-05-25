import React, { useCallback, useContext, useEffect, useState } from 'react'
import Web3Context from '../context/Web3Context'
import styled from 'styled-components/macro'
import { BigVaultFirstOverlay, VaultFirstTitle } from '../styling/styles'
import { BigNumber } from 'ethers'
import { getTokenBalances } from '../sdk/helpers'
import { VaultContext } from '../context/VaultContext'
import { DepositWithdrawView } from './DepositWithdrawView'
import { TokenBalance } from '../types'
import { ToggleView } from './ToggleView'
import { StakeUnstakeView } from './StakeUnstakeView'
import { ManageVaultView, MOCK_ERC_20_ADDRESS } from '../constants'
import { NamedColors } from '../styling/colors'

interface TokenMetaData {
  address: string
  name: string
}

interface Props {}

export const ManageVault: React.FC<Props> = () => {
  const { signer } = useContext(Web3Context)
  const { selectedVault } = useContext(VaultContext)
  const vault = selectedVault!

  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [tokenMetaData] = useState<TokenMetaData[]>(Array(5).fill(({ address: MOCK_ERC_20_ADDRESS, name: 'MockERC20' })))

  // To control the view switch between stake/unstake and deposit/withdraw
  const [view, setView] = useState<ManageVaultView>(ManageVaultView.BALANCE)
  const getToggleOptions = () => Object.values(ManageVaultView).map(view => view.toString())
  const selectView = (option: string) => setView(ManageVaultView[option as keyof typeof ManageVaultView])

  const getBalances = useCallback(async () => {
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
  }, [tokenMetaData, signer, vault.id]);

  useEffect(() => {
    getBalances()
  }, [getBalances])

  return (
    <>
      <VaultFirstTitle>{view === ManageVaultView.BALANCE ? 'Balances' : 'Stakes'}</VaultFirstTitle>
      <Note>ID: {vault.id}</Note>
      <BigVaultFirstOverlay>
        <ToggleView options={getToggleOptions()} toggleOption={selectView} activeOption={view.toString()} />
        {view === ManageVaultView.BALANCE ? (
          <DepositWithdrawView tokenBalances={tokenBalances} />
        ) : (
          <StakeUnstakeView />
        )}
      </BigVaultFirstOverlay>
    </>
  )
}

const Note = styled.h3`
  font-size: 1rem;
  color: ${NamedColors.GRAY}
`
