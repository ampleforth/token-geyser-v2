import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { GeyserStakeView } from './GeyserStakeView'
import { Overlay } from '../styling/styles'
import { ToggleView } from './ToggleView'
import tw from 'twin.macro'
import { GeyserContext } from '../context/GeyserContext'
import { GeyserStatsView } from './GeyserStatsView'

interface Props {}

export const GeyserFirstContainer: React.FC<Props> = () => {
  const { isStakingAction, toggleStakingAction } = useContext(GeyserContext)

  return (
    <div className="flex flex-col flex-wrap">
      <Container>
        <Container>
          <Overlay>
            <GeyserStatsView />
          </Overlay>
        </Container>
        <Overlay>
          <ToggleView enabled={isStakingAction} toggle={toggleStakingAction} />
          <GeyserStakeView />
        </Overlay>
      </Container>
    </div>
  )
}

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-wrap w-full`}
  ${tw`sm:w-sm`}
`
