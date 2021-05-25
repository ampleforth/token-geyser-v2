import { useLazyQuery } from '@apollo/client'
import React, { useContext, useEffect, useState } from 'react'
import styled from 'styled-components/macro'
import Web3Context from '../context/Web3Context'
import { Vault, VaultMetaData } from '../types'
import { GET_USER_VAULTS } from '../queries/vault'
import { VaultState } from '../constants'
import { SelectVault } from './SelectVault'
import { ManageVault } from './ManageVault'

interface Props {}

export const VaultFirstContainer: React.FC<Props> = () => {
  const { address } = useContext(Web3Context)
  const [getVaults, { loading, data }] = useLazyQuery(GET_USER_VAULTS, {
    pollInterval: 5000,
  })
  const [vaults, setVaults] = useState<VaultMetaData[]>([])

  const [selectedVault, setSelectedVault] = useState<string | null>(null)

  const handleSelectVault = (vaultId: string | null) => setSelectedVault(vaultId)

  const getSelectedVault = () => vaults.filter((v) => v.id === selectedVault)[0]

  useEffect(() => {
    if (address) getVaults({ variables: { id: address } })
  }, [address, getVaults])

  useEffect(() => {
    if (data && data.user) {
      const userVaults = data.user.vaults as Vault[]
      setVaults(
        (userVaults || []).map((vault) => ({
          id: vault.id,
          state: VaultState.INACTIVE,
        })), // TODO: figure out state
      )
    }
  }, [data])

  if (loading) return <></>

  return (
    <Container>
      {!selectedVault ? (
        <SelectVault vaults={vaults} setSelectedVault={handleSelectVault} />
      ) : (
        <ManageVault vault={getSelectedVault()} />
      )}
    </Container>
  )
}

const Container = styled.div`
  width: 640px;
  height: 80%;
  text-align: center;
  margin: auto;
`
