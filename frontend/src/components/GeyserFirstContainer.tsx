import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { GeyserStakeView } from './GeyserStakeView'
import { GeyserFirstOverlay } from '../styling/styles'
import { ToggleView } from './ToggleView'
import tw from 'twin.macro'
import { GeyserContext } from 'context/GeyserContext'
import { GeyserStatsView } from './GeyserStatsView'

interface Props {}

export const GeyserFirstContainer: React.FC<Props> = () => {
  const { isStakingAction, toggleStakingAction } = useContext(GeyserContext)

  return (
    <div className="flex flex-col flex-wrap">
      <Container>
        <Container>
          <GeyserFirstOverlay>
            <GeyserStatsView />
          </GeyserFirstOverlay>
        </Container>
        <GeyserFirstOverlay>
          <ToggleView enabled={isStakingAction} toggle={toggleStakingAction} />
          <GeyserStakeView />
        </GeyserFirstOverlay>
      </Container>
    </div>
  )
}

const Container = styled.div`
  width: 648px;
  ${tw`text-center m-auto my-4 flex flex-wrap`}
`
