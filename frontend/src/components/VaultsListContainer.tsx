import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import Web3Context from '../context/Web3Context'
import { VaultMetaData } from '../types'
import { VaultListItem } from './VaultListItem'

interface SelectVaultProps {
  vaults: VaultMetaData[]
  setSelectedVault: (arg0: string | null) => void
}

export const VaultsListContainer: React.FC<SelectVaultProps> = ({ vaults, setSelectedVault }) => {
  const { ready } = useContext(Web3Context)

  if (!ready) return <VaultInfoMessage>Connect to your ethereum wallet</VaultInfoMessage>

  if (vaults.length === 0) return <VaultInfoMessage>No vaults yet</VaultInfoMessage>

  return (
    <VaultsContainer>
      {vaults.map((vault) => (
        <VaultListItem vault={vault} key={vault.id} setSelectedVault={setSelectedVault} />
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

const VaultInfoMessage = styled.h1`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
`
