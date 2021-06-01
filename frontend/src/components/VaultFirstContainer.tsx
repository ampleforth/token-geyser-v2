import React from 'react'
import styled from 'styled-components/macro'
import { GeyserStakeView } from './GeyserStakeView'
import { GeyserFirstOverlay } from '../styling/styles'

interface Props {}

export const VaultFirstContainer: React.FC<Props> = () => {
  return (
    <div className="flex flex-wrap">
      <Container>
        <GeyserFirstOverlay>
          <GeyserStakeView />
        </GeyserFirstOverlay>
      </Container>
    </div>
  )
}

const Container = styled.div`
  text-align: center;
  margin: auto;
`
