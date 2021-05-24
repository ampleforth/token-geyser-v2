import React from 'react'
import styled from 'styled-components/macro'
import { VaultMetaData } from '../types'
import { displayAddr } from '../utils/formatDisplayAddress'
import { VaultStateColors } from '../constants'
import { NamedColors } from '../styling/colors'
import { Aligned } from '../styling/mixins'

interface VaultRowProps {
  vault: VaultMetaData
}

export const VaultFirstListItem: React.FC<VaultRowProps> = ({
  vault: { id, state },
}) => {
  return (
    <VaultPreviewButton>
      <LeftAlign>{displayAddr(id)}</LeftAlign>
      <RightAlign>
        <VaultStatusColor color={VaultStateColors[state]} />
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
