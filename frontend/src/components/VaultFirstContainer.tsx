import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { SelectVault } from './SelectVault'
import { ManageVault } from './ManageVault'
import { VaultContext } from '../context/VaultContext'

interface Props {}

export const VaultFirstContainer: React.FC<Props> = () => {
  const { selectedVault } = useContext(VaultContext)
  return (
    <Container>
      {!selectedVault ? (
        <SelectVault />
      ) : (
        <ManageVault />
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
