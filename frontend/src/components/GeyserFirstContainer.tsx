import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserStakeView } from './GeyserStakeView'
import { GeyserFirstOverlay } from '../styling/styles'
import { ToggleView } from './ToggleView'
import { GeyserContext } from '../context/GeyserContext'
import { GeyserStatsView } from './GeyserStatsView'
import { VaultsList } from './VaultsList'
import { GeysersList } from './GeysersList'

export const GeyserFirstContainer = () => {
  const { isStakingAction, toggleStakingAction } = useContext(GeyserContext)

  return (
    <Container>
      <Center>
        <VaultsList />
        <GeysersList />
      </Center>
      <GeyserFirstOverlay>
        <GeyserStatsView />
      </GeyserFirstOverlay>
      <GeyserFirstOverlay>
        <ToggleView enabled={isStakingAction} toggle={toggleStakingAction} />
        <GeyserStakeView />
      </GeyserFirstOverlay>
    </Container>
  )
}

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-col flex-wrap w-full`}
  ${tw`sm:w-sm`}
`

const Center = styled.div`
  ${tw`text-center m-auto my-4 flex flex-col flex-wrap`}
`
