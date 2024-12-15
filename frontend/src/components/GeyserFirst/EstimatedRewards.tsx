import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useContext, useEffect, useState } from 'react'
import { StatsContext } from 'context/StatsContext'
import { safeNumeral } from 'utils/numeral'
import BigNumber from 'bignumber.js'
import { BigNumber as BigInt } from 'ethers'
import { Tooltip } from 'components/Tooltip'
import { CardValue, CardLabel, Loader } from 'styling/styles'
import { GeyserContext } from 'context/GeyserContext'
import { DRIP_RATE_MSG } from '../../constants'
import DepositInfoGraphic from './DepositInfoGraphic'

interface Props {
  parsedUserInput: BigInt
}

export const EstimatedRewards: React.FC<Props> = ({ parsedUserInput }) => {
  const [rewards, setRewards] = useState<number>(0.0)
  const [deposits, setDeposits] = useState<number>(0.0)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { price: rewardTokenPrice },
      stakingTokenInfo: { price: stakingTokenPrice, decimals: stakingTokenDecimals },
    },
  } = useContext(GeyserContext)

  const {
    computeRewardsFromAdditionalStakes,
    geyserStats: { calcPeriodInDays },
    vaultStats: { currentStake },
  } = useContext(StatsContext)

  useEffect(() => {
    let isMounted = true
    setIsCalculating(true)
    const debounceTimer = setTimeout(async () => {
      try {
        const aggregateDepositUSD = new BigNumber(parsedUserInput.toString())
          .div(10 ** stakingTokenDecimals)
          .plus(currentStake)
          .times(stakingTokenPrice)
        const isZero = aggregateDepositUSD.eq('0')
        const newRewards = isZero ? 0.0 : await computeRewardsFromAdditionalStakes(parsedUserInput)
        const newDeposits = isZero ? 0.0 : aggregateDepositUSD.toNumber()

        if (isMounted) {
          setRewards(newRewards)
          setDeposits(newDeposits)
          setIsCalculating(false)
        }
      } catch (error) {
        if (isMounted) {
          setIsCalculating(false)
        }
        console.error('Error calculating rewards:', error)
      }
    }, 500)

    return () => {
      isMounted = false
      clearTimeout(debounceTimer)
    }
  }, [parsedUserInput, computeRewardsFromAdditionalStakes, currentStake, stakingTokenPrice, stakingTokenDecimals])

  const geyserRewardsUSD = rewards * rewardTokenPrice

  return (
    <EstimatedRewardsContainer>
      <ColoredDiv />
      <DepositInfoGraphic />
      {isCalculating ? (
        <LoaderContainer>
          <Loader className="loader" />
        </LoaderContainer>
      ) : (
        <RewardsTextContainer>
          <CardLabel>
            <small>Drip Rate</small>
            <Tooltip
              classNames="my-auto ml-2 normal-case tracking-wide"
              panelClassnames="-translate-x-3/4 xs:left-1/2 xs:-translate-x-1/2"
              messages={[{ title: 'Estimated Rewards', body: DRIP_RATE_MSG() }]}
            />
          </CardLabel>
          <CardValue>
            {safeNumeral(deposits, '0.00')} USD / {safeNumeral(geyserRewardsUSD, '0.00')} USD
            <span>
              {' '}
              {geyserRewardsUSD > 0 && calcPeriodInDays > 0
                ? `for ${safeNumeral(calcPeriodInDays, '0')} day${calcPeriodInDays > 1 ? 's' : ''}`
                : ''}
            </span>
          </CardValue>
        </RewardsTextContainer>
      )}
    </EstimatedRewardsContainer>
  )
}

const EstimatedRewardsContainer = styled.div`
  ${tw`h-120px my-6 border border-lightGray flex flex-row tracking-wide`}
`

const ColoredDiv = styled.div`
  ${tw`h-full bg-radicalRed w-2`}
`

const RewardsTextContainer = styled.div`
  ${tw`flex flex-col my-auto px-4`}
`

const LoaderContainer = styled.div`
  ${tw`flex items-center w-full ml-4`}
`
