import { useContext, useCallback } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserContext } from 'context/GeyserContext'
import { StatsContext } from 'context/StatsContext'
import { ResponsiveText } from 'styling/styles'
import { safeNumeral } from 'utils/numeral'
import { Tooltip } from 'components/Tooltip'
import { GeyserStatsBox } from './GeyserStatsBox'
import { GeyserMultiStatsBox } from './GeyserMultiStatsBox'
import {
  GET_APY_NO_STAKE_MSG,
  GET_APY_STAKE_MSG,
  GET_CURRENT_REWARDS_MSG,
  GET_REWARD_MULTIPLIER_MSG,
} from '../../constants'

export const MyStats = () => {
  const {
    userStats: { apy, currentMultiplier, maxMultiplier, currentReward, currentRewardShare },
    vaultStats: { currentStake },
    geyserStats: { calcPeriodInDays, bonusRewards },
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
        body:
          currentStake > 0
            ? GET_APY_STAKE_MSG()
            : GET_APY_NO_STAKE_MSG({ days: safeNumeral(calcPeriodInDays || 30, '0.0') }),
      },
      {
        title: 'Reward Multiplier',
        body: GET_REWARD_MULTIPLIER_MSG({
          days: safeNumeral(calcPeriodInDays || 30, '0.0'),
          multiplier: safeNumeral(maxMultiplier || 3, '0.0'),
        }),
      },
      {
        title: 'Current Rewards',
        body: GET_CURRENT_REWARDS_MSG(),
      },
    ],
    [currentStake],
  )

  const rewardsToShow = [{ value: currentReward, units: rewardTokenSymbol }].concat(
    bonusRewards.map((r) => ({ value: currentRewardShare * r.balance, units: r.symbol })),
  )

  return (
    <MyStatsContainer>
      <Header>
        My Stats{' '}
        <Tooltip
          classNames="my-auto ml-2 normal-case tracking-wide bg-white"
          panelClassnames="-translate-x-1/4"
          messages={getTooltipMessages()}
        />
      </Header>
      <GeyserStatsContainer>
        <GeyserStatsBoxContainer>
          <GeyserStatsBox
            containerClassName="w-1/2 sm:rounded-md font-bold sm:text-black"
            name="APY"
            value={Math.min(apy, 10000)}
            units="%"
            interpolate={(val) => safeNumeral(val, '0.00%').slice(0, val > 100 ? -4 : -1)}
          />
          <GeyserStatsBox
            containerClassName="w-1/2 sm:rounded-md font-bold sm:text-black"
            name="Multiplier"
            value={currentMultiplier}
            units="x"
            interpolate={(val) => safeNumeral(val, '0.0')}
          />
        </GeyserStatsBoxContainer>

        <GeyserStatsBoxContainer>
          <GeyserStatsBox
            containerClassName="w-full sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm"
            name="Current Stake"
            value={currentStake * stakingTokenPrice}
            units="USD"
            interpolate={(val) => safeNumeral(val, '0,0.00')}
          />
        </GeyserStatsBoxContainer>

        <GeyserStatsBoxContainer>
          <GeyserMultiStatsBox
            containerClassName="w-full sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm"
            name="Current Rewards"
            stats={rewardsToShow}
            interpolate={(val) => safeNumeral(val, '0.000')}
          />
        </GeyserStatsBoxContainer>
      </GeyserStatsContainer>
    </MyStatsContainer>
  )
}

const MyStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0 border-r-2 border-lightGray`}
`

const Header = styled.h3`
  ${ResponsiveText}
  ${tw`uppercase flex text-black font-medium sm:pl-3`}
`

const GeyserStatsContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-0`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`flex mt-4 sm:mt-3`}
`
