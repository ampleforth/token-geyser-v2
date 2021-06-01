import React from 'react'
import { VaultsListContainer } from './VaultsListContainer'
import { MintVaultButton } from './MintVaultButton'
import { VaultFirstOverlay, VaultFirstTitle } from '../styling/styles'

interface Props {}

export const SelectVault: React.FC<Props> = () => (
  <>
    <VaultFirstTitle>Select a vault</VaultFirstTitle>
    <VaultFirstOverlay>
      <VaultsListContainer />
      <MintVaultButton />
    </VaultFirstOverlay>
  </>
)
