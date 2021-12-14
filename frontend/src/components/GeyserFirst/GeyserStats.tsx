import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useContext } from 'react'
import { StatsContext } from 'context/StatsContext'
import { GeyserContext } from 'context/GeyserContext'
import { safeNumeral } from 'utils/numeral'
import { ResponsiveText } from 'styling/styles'
import { GeyserStatsBox } from './GeyserStatsBox'
import { DAY_IN_SEC } from '../../constants'

export const GeyserStats = () => {
  const { geyserStats: { duration, totalDeposit, totalRewards }} = useContext(StatsContext)
  const { selectedGeyserInfo: { rewardTokenInfo: { symbol } } } = useContext(GeyserContext)
  return (
    <GeyserStatsContainer>
      <Header>Geyser Stats</Header>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          name="Program Duration"
          value={duration / DAY_IN_SEC}
          units="days left"
          interpolate={(val) => safeNumeral(val, '0.0')}
        />
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          name="Total Deposits"
          value={totalDeposit}
          units="USD"
          interpolate={(val) => safeNumeral(val, '0,0.00')}
        />
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          name="Total Rewards"
          value={totalRewards}
          units={symbol}
          interpolate={(val) => safeNumeral(val, '0,0.00')}
        />
      </GeyserStatsBoxContainer>
    </GeyserStatsContainer>
  )
}

const GeyserStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0`}
`

const Header = styled.h3`
  ${ResponsiveText}
  ${tw`uppercase flex font-medium text-radicalRed`}
  ${tw`sm:pl-3`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-3`}
`
