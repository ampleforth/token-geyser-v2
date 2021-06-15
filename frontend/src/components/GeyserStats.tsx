import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserStatsBox } from './GeyserStatsBox'

export const GeyserStats = () => {
  return (
    <GeyserStatsContainer>
      <Header>Geyser Stats</Header>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox name="Program Duration" value="44.6 days left"></GeyserStatsBox>
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox name="Total Deposits" value="4,640,563.97 USD"></GeyserStatsBox>
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox name="Total Rewards" value="1,263,169.53 AMPL"></GeyserStatsBox>
      </GeyserStatsBoxContainer>
    </GeyserStatsContainer>
  )
}

const GeyserStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${tw`text-sm sm:text-base uppercase flex font-medium sm:pl-3`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`mt-4 sm:mt-3`}
`
