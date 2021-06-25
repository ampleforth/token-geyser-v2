import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { MyStats } from './MyStats'
import { GeyserStats } from './GeyserStats'

export const GeyserStatsView = () => (
  <GeyserStatsContainer>
    <MyStats />
    <GeyserStats />
  </GeyserStatsContainer>
)

const GeyserStatsContainer = styled.div`
  ${tw`grid grid-cols-2 w-full h-280px`};
  ${tw`sm:h-312px`}
`
