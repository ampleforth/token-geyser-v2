import React from 'react'
import { VaultsListContainer } from './VaultsListContainer'
import styled from 'styled-components/macro'
import { MintVaultButton } from './MintVaultButton'
import { VaultMetaData } from '../types'
import { VaultFirstOverlay, VaultFirstTitle } from '../styling/styles'

interface Props {
  vaults: VaultMetaData[]
  setSelectedVault: (arg0: string | null) => void
}

export const SelectVault: React.FC<Props> = ({ vaults, setSelectedVault }) => {
  return (
    <>
      <VaultFirstTitle>Select a vault</VaultFirstTitle>
      <VaultFirstOverlay>
        <VaultsListContainer vaults={vaults} setSelectedVault={setSelectedVault} />
        <MintVaultButton />
      </VaultFirstOverlay>
    </>
  )
}
