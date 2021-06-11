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
  ${tw`w-full font-roboto m-5`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${tw`uppercase flex font-medium mx-5`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`mt-3 mr-6`}
`
