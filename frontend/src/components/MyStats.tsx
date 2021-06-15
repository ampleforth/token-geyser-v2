import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveText } from 'styling/styles'
import { GeyserStatsBox } from './GeyserStatsBox'
import { MyStatsBox } from './MyStatsBox'

export const MyStats = () => {
  return (
    <MyStatsContainer>
      <Header>My Stats</Header>
      <MyStatsWrapper>
        <MyStatsBox classNames="sm:my-6" name="APY" value="19.44" units="%" />
        <MyStatsBox name="Reward Multiplier" value="1.0" units="x" />
        <MyStatsBox name="Current Rewards" value="0.00" delim=" " units="AMPL" />
      </MyStatsWrapper>
      <GeyserStatsContainer>
        <GeyserStatsBox name="External Rewards" value="0.00" units="BAL"></GeyserStatsBox>
      </GeyserStatsContainer>
    </MyStatsContainer>
  )
}

const MyStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0 border-r-2 border-lightGray`}
`

const MyStatsWrapper = styled.div`
  ${tw`sm:grid sm:grid-cols-3 sm:h-180px`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${ResponsiveText}
  ${tw`uppercase flex font-medium sm:pl-3`}
`

const GeyserStatsContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-0`}
`
