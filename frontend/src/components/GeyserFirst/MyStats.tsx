import { useContext, useCallback } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserContext } from 'context/GeyserContext'
import { StatsContext } from 'context/StatsContext'
import { ResponsiveText } from 'styling/styles'
import { safeNumeral } from 'utils/numeral'
import { Tooltip } from 'components/Tooltip'
import { GeyserStatsBox } from './GeyserStatsBox'
import { MyStatsBox } from './MyStatsBox'
import {
  DAY_IN_SEC,
  GET_APY_NO_STAKE_MSG,
  GET_APY_STAKE_MSG,
  GET_CURRENT_REWARDS_MSG,
  GET_REWARD_MULTIPLIER_MSG,
} from '../../constants'

export const MyStats = () => {
  const {
    userStats: { apy, currentMultiplier, maxMultiplier, currentReward },
    vaultStats: { currentStake },
    geyserStats: { duration, calcPeriodInDays},
  } = useContext(StatsContext)
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol: rewardTokenSymbol },
      stakingTokenInfo: { price: stakingTokenPrice },
    },
  } = useContext(GeyserContext)

  const getTooltipMessages = useCallback(
    () => [
      {
        title: 'APY',
        body: currentStake > 0 ? GET_APY_STAKE_MSG() : GET_APY_NO_STAKE_MSG({ days: safeNumeral(duration / DAY_IN_SEC, '0.0') }),
      },
      {
        title: 'Reward Multiplier',
        body: GET_REWARD_MULTIPLIER_MSG({ days: safeNumeral(calcPeriodInDays, '0.0'), multiplier: safeNumeral(maxMultiplier, '0.0') }),
      },
      {
        title: 'Current Rewards',
        body: GET_CURRENT_REWARDS_MSG(),
      },
    ],
    [currentStake],
  )

  return (
    <MyStatsContainer>
      <Header>
        My Stats <Tooltip classNames="my-auto ml-2 normal-case tracking-wide" panelClassnames='-translate-x-1/4' messages={getTooltipMessages()} />
      </Header>
      <MyStatsWrapper>
        <MyStatsBox
          classNames="sm:my-6"
          name="APY"
          value={Math.min(apy, 10000)}
          units="%"
          interpolate={(val) => safeNumeral(val, '0.00%').slice(0, val > 100 ? -4 : -1)}
        />
        <MyStatsBox
          name="Reward Multiplier"
          value={currentMultiplier}
          units="x"
          interpolate={(val) => safeNumeral(val, '0.0')}
        />
        <MyStatsBox
          name="Current Rewards"
          value={currentReward}
          delim=" "
          units={rewardTokenSymbol}
          interpolate={(val) => safeNumeral(val, '0,0.00')}
        />
      </MyStatsWrapper>
      <GeyserStatsContainer>
        <GeyserStatsBox
          name="Total Staked"
          value={currentStake * stakingTokenPrice}
          units="USD"
          interpolate={(val) => safeNumeral(val, '0,0.00')}
        />
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
  ${ResponsiveText}
  ${tw`uppercase flex text-radicalRed font-medium sm:pl-3`}
`

const GeyserStatsContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-0`}
`
