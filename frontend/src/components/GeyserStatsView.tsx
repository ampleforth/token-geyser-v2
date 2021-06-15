import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { MyStats } from './MyStats'
import { GeyserStats } from './GeyserStats'

export const GeyserStatsView = () => {
  return (
    <GeyserStatsContainer>
      <MyStats />
      <GeyserStats />
    </GeyserStatsContainer>
  )
}

const GeyserStatsContainer = styled.div`
  width: 100%;
  ${tw`grid grid-cols-2 h-280px sm:h-312px`};
`
