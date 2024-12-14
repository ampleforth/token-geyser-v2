import { useState, useEffect, useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import Web3Context from 'context/Web3Context'
import { GeyserContext } from 'context/GeyserContext'
import { StatsContext } from 'context/StatsContext'
import { safeNumeral } from 'utils/numeral'
import TooltipTable from 'components/TooltipTable'
import { GeyserStatsBox } from './GeyserStatsBox'
import { GET_APY_STAKE_MSG, GET_REWARD_MULTIPLIER_MSG, CURRENT_REWARDS_MSG } from '../../constants'

export const MyStats = () => {
  const { ready } = useContext(Web3Context)
  const {
    userStats: { apy, currentMultiplier, maxMultiplier, currentReward },
    vaultStats: { currentStake },
    geyserStats: { calcPeriodInDays },
  } = useContext(StatsContext)
  const {
    selectedGeyserInfo: {
      geyser: selectedGeyser,
      rewardTokenInfo: { symbol: rewardTokenSymbol, price: rewardTokenPrice },
      stakingTokenInfo: { price: stakingTokenPrice },
    },
    getGeyserConfig,
    stakeAPYs,
  } = useContext(GeyserContext)

  const [lpAPY, setLPAPY] = useState<number>(0)
  const [geyserAPY, setGeyserAPY] = useState<number>(0)
  const [finalAPY, setFinalAPY] = useState<number>(0)
  useEffect(async () => {
    if (!selectedGeyser) {
      return
    }
    const config = getGeyserConfig(selectedGeyser.id)
    const lpAPYNew = (stakeAPYs.lp && stakeAPYs.lp[config.lpRef]) || 0
    const geyserAPYGlobal = stakeAPYs.geysers && stakeAPYs.geysers[config.ref]
    const geyserAPYNew = ready ? apy : geyserAPYGlobal || apy
    setLPAPY(lpAPYNew)
    setGeyserAPY(geyserAPYNew)
    setFinalAPY(Math.min(geyserAPYNew + lpAPYNew, 100000))
  }, [selectedGeyser, apy])

  // NOTE: removed bonus tokens
  const baseRewards = currentReward * rewardTokenPrice
  return (
    <MyStatsContainer>
      <Header>My Stats </Header>
      <GeyserStatsContainer>
        <GeyserStatsBoxContainer>
          <GeyserStatsBox
            containerClassName="w-1/2"
            name="APY"
            value={finalAPY}
            units="%"
            interpolate={(val) => safeNumeral(val, '0.00%').slice(0, val > 100 ? -4 : -1)}
            tooltipMessage={{
              title: 'Staking Yield',
              body: (
                <div>
                  {GET_APY_STAKE_MSG()}
                  <TooltipTable
                    rows={[
                      { label: 'LP yield', value: safeNumeral(lpAPY, '0.00%') },
                      { label: 'Geyser drip', value: safeNumeral(geyserAPY, '0.00%') },
                      { label: 'Bonus', value: '0.00%' },
                    ]}
                    totalLabel="Combined APY"
                    totalValue={safeNumeral(finalAPY, '0.00%')}
                  />
                </div>
              ),
            }}
          />

          <GeyserStatsBox
            containerClassName="w-1/2"
            name="Multiplier"
            value={currentMultiplier}
            units="x"
            interpolate={(val) => safeNumeral(val, '0.0')}
            tooltipMessage={{
              title: 'Bonus Multiplier',
              body: GET_REWARD_MULTIPLIER_MSG({
                days: safeNumeral(Math.max(calcPeriodInDays || 30, 30), '0'),
                multiplier: safeNumeral(maxMultiplier || 3, '0.0'),
              }),
            }}
          />
        </GeyserStatsBoxContainer>

        <GeyserStatsBoxContainer>
          <GeyserStatsBox
            containerClassName="w-full"
            name="Current Stake"
            value={currentStake * stakingTokenPrice}
            units="USD"
            interpolate={(val) => safeNumeral(val, '0,0.00')}
          />
        </GeyserStatsBoxContainer>

        <GeyserStatsBoxContainer>
          <GeyserStatsBox
            containerClassName="w-full"
            name="Current Rewards"
            value={baseRewards}
            units="USD"
            interpolate={(val) => safeNumeral(val, '0,0.00')}
            tooltipMessage={{
              title: 'Current Rewards',
              body: (
                <div>
                  {CURRENT_REWARDS_MSG()}
                  <TooltipTable
                    rows={[
                      {
                        label: `${rewardTokenSymbol} (${safeNumeral(currentReward, '0.00')})`,
                        value: `${safeNumeral(baseRewards, '0,0.00')} USD`,
                      },
                      { label: 'bonus', value: `${safeNumeral(0, '0,0.00')} USD` },
                    ]}
                    totalLabel="Total"
                    totalValue={`${safeNumeral(baseRewards, '0,0.00')} USD`}
                  />
                </div>
              ),
            }}
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
  ${tw`uppercase flex text-radicalRed font-medium sm:pl-3`}
`

const GeyserStatsContainer = styled.div`
  ${tw`mt-4`}
  ${tw`sm:mt-0`}
`

const GeyserStatsBoxContainer = styled.div`
  ${tw`flex mt-4 sm:mt-3`}
`
