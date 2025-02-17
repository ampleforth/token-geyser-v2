import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useContext } from 'react'
import { StatsContext } from 'context/StatsContext'
import { GeyserContext } from 'context/GeyserContext'
import { safeNumeral } from 'utils/numeral'
import TooltipTable from 'components/TooltipTable'
import { GeyserStatsBox } from './GeyserStatsBox'
import { DAY_IN_SEC, TOTAL_REWARDS_MSG } from '../../constants'

export const GeyserStats = () => {
  const {
    geyserStats: { duration, totalDepositVal, totalRewards, totalRewardsVal },
  } = useContext(StatsContext)
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol: rewardTokenSymbol },
    },
  } = useContext(GeyserContext)

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
          value={totalDepositVal}
          units="USD"
          interpolate={(val) => safeNumeral(val, '0,0')}
        />
      </GeyserStatsBoxContainer>
      <GeyserStatsBoxContainer>
        <GeyserStatsBox
          containerClassName="w-full"
          name="Total Rewards"
          value={totalRewardsVal}
          units="USD"
          interpolate={(val) => safeNumeral(val, '0,0')}
          tooltipMessage={{
            title: 'Total Rewards',
            body: (
              <div>
                {TOTAL_REWARDS_MSG()}
                <TooltipTable
                  rows={[
                    {
                      label: `${rewardTokenSymbol} (${safeNumeral(totalRewards, '0,0')})`,
                      value: `${safeNumeral(totalRewardsVal, '0,0.00')} USD`,
                    },
                    { label: 'bonus (0)', value: `${safeNumeral(0, '0,0.00')} USD` },
                  ]}
                  totalLabel="Total"
                  totalValue={`${safeNumeral(totalRewardsVal, '0,0.00')} USD`}
                />
              </div>
            ),
          }}
        />
      </GeyserStatsBoxContainer>
    </GeyserStatsContainer>
  )
}

const GeyserStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0`}
`

const Header = styled.h3`
  ${tw`uppercase flex font-medium text-radicalRed`}
  ${tw`sm:pl-3`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`flex mt-4 sm:mt-3`}
`
