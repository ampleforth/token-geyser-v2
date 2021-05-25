import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { Vault } from '../types'
import { displayAddr } from '../utils/formatDisplayAddress'
import { VaultState, VaultStateColors } from '../constants'
import { NamedColors } from '../styling/colors'
import { Aligned } from '../styling/mixins'
import { VaultContext } from '../context/VaultContext'

interface VaultRowProps {
  vault: Vault
}

export const VaultListItem: React.FC<VaultRowProps> = ({ vault }) => {
  const { selectVault } = useContext(VaultContext)

  return (
    <VaultPreviewButton onClick={() => selectVault(vault)}>
      <LeftAlign>{displayAddr(vault.id)}</LeftAlign>
      <RightAlign>
        {/* TODO: Show correct vault status */}
        <VaultStatusColor color={VaultStateColors[VaultState.INACTIVE]} />
      </RightAlign>
    </VaultPreviewButton>
  )
}

const VaultPreviewButton = styled.button`
  width: 100%;
  font-size: 1rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  vertical-align: middle;
  justify-content: center;
  align-content: center;
  border: 1px solid ${NamedColors.ALTO};
  border-radius: 10px;
  cursor: pointer;
  background-color: ${NamedColors.WHITE};
  padding: 12px 16px;
  transition: 0.3s;
  :hover {
    background-color: ${NamedColors.ALTO};
  }
`

const VaultStatusColor = styled.span`
  height: 20px;
  width: 20px;
  background-color: ${(props) => props.color};
  border-radius: 50%;
  display: inline-block;
`

const LeftAlign = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  ${Aligned('left')};
`

const RightAlign = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  ${Aligned('right')};
`
