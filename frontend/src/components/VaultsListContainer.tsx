import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import VaultsContext from '../context/VaultsContext'
import Web3Context from '../context/Web3Context'
import { VaultInfoMessage } from '../styling/styles'
import { VaultListItem } from './VaultListItem'

interface SelectVaultProps {}

export const VaultsListContainer: React.FC<SelectVaultProps> = () => {
  const { ready } = useContext(Web3Context)
  const { vaults } = useContext(VaultsContext)

  if (!ready) return <VaultInfoMessage>Connect to your ethereum wallet</VaultInfoMessage>

  if (vaults.length === 0) return <VaultInfoMessage>No vaults yet</VaultInfoMessage>

  return (
    <VaultsContainer>
      {vaults.map((vault) => (
        <VaultListItem vault={vault} key={vault.id} />
      ))}
    </VaultsContainer>
  )
}

const VaultsContainer = styled.div`
  padding: 20px;
  overflow-y: hidden;
  :hover {
    overflow-y: overlay;
  }
`
