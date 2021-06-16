import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserContext } from '../context/GeyserContext'
import { StatsContext } from '../context/StatsContext'
import { ResponsiveText } from '../styling/styles'
import { safeNumeral } from '../utils/numeral'
import { GeyserStatsBox } from './GeyserStatsBox'
import { MyStatsBox } from './MyStatsBox'

export const MyStats = () => {
  const { userStats: { apy, currentMultiplier, currentReward }, vaultStats: { stakingTokenBalance } } = useContext(StatsContext)
  const { rewardTokenInfo: { symbol: rewardTokenSymbol }, stakingTokenInfo: { price: stakingTokenPrice }} = useContext(GeyserContext)

  return (
    <MyStatsContainer>
      <Header>My Stats</Header>
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
          value={stakingTokenBalance * stakingTokenPrice}
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
