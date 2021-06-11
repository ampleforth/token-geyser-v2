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
  width: 696px;
  height: 312px;
  ${tw`font-roboto grid grid-flow-col`};
`
