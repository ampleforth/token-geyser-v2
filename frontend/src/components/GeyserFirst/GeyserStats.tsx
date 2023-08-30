import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useContext } from 'react'
import { StatsContext } from 'context/StatsContext'
import { GeyserContext } from 'context/GeyserContext'
import { safeNumeral } from 'utils/numeral'
import { ResponsiveText } from 'styling/styles'
import { GeyserStatsBox } from './GeyserStatsBox'
import { GeyserMultiStatsBox } from './GeyserMultiStatsBox'
import { DAY_IN_SEC } from '../../constants'

export const GeyserStats = () => {
  const {
    geyserStats: { duration, totalDeposit, totalRewards, bonusRewards },
  } = useContext(StatsContext)
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol },
    },
  } = useContext(GeyserContext)

  const rewardsToShow = [{ value: totalRewards, units: symbol }].concat(
    bonusRewards.map((r) => ({ value: r.balance, units: r.symbol })),
  )

  return (
    <GeyserStatsContainer>
      <Header>Farm Stats</Header>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          containerClassName="sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm"
          name="Program Duration"
          value={duration / DAY_IN_SEC}
          units="days left"
          interpolate={(val) => safeNumeral(val, '0.0')}
        />
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          containerClassName="sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm"
          name="Total Deposits"
          value={totalDeposit}
          units="USD"
          interpolate={(val) => safeNumeral(val, '0,0.00')}
        />
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserMultiStatsBox
          containerClassName="sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm"
          name="Total Rewards"
          stats={rewardsToShow}
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
  ${tw`uppercase flex font-medium text-black`}
  ${tw`sm:pl-3`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-3`}
`
