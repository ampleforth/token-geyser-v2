import styled from 'styled-components/macro'
import tw from 'twin.macro'
import rewardSymbol from 'assets/rewardSymbol.svg'
import { useContext, useEffect, useState } from 'react'
import { StatsContext } from 'context/StatsContext'
import { safeNumeral } from 'utils/numeral'
import BigNumber from 'bignumber.js'
import {BigNumber as BigInt} from 'ethers'
import { Tooltip } from 'components/Tooltip'
import { CardValue, CardLabel } from 'styling/styles'
import { GeyserContext } from 'context/GeyserContext'
import { GET_ESTIMATED_REWARDS_MSG } from '../../constants'

interface Props {
  parsedUserInput: BigInt
}

export const EstimatedRewards: React.FC<Props> = ({ parsedUserInput }) => {
  const [rewards, setRewards] = useState<string>('0.00')
  const [deposits, setDeposits] = useState<string>('0')
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol },
      stakingTokenInfo: { price: stakingTokenPrice, decimals: stakingTokenDecimals },
    }
  } = useContext(GeyserContext)
  const {
    computeRewardsFromAdditionalStakes,
    geyserStats: { calcPeriodInDays },
    vaultStats: { currentStake }
  } = useContext(StatsContext)


  useEffect(() => {
    (async () => {
      const aggregateDepositUSD = new BigNumber(parsedUserInput.toString())
        .div(10**stakingTokenDecimals)
        .plus(currentStake)
        .times(stakingTokenPrice)

      setRewards(
        aggregateDepositUSD.eq('0') ? '0.00' : safeNumeral(await computeRewardsFromAdditionalStakes(parsedUserInput), '0.00')
      )

      setDeposits(
        aggregateDepositUSD.eq('0') ? '0' : safeNumeral(aggregateDepositUSD.toNumber(), '0')
      )
    })();
  }, [parsedUserInput])

  return (
    <EstimatedRewardsContainer>
      <ColoredDiv />
      <Icon src={rewardSymbol} alt="Rewards Symbol" />
      <RewardsTextContainer>
        <CardLabel>
          <small>Aggregate Deposit / Estimated Rewards</small>
          <Tooltip
            classNames="my-auto ml-2 normal-case tracking-wide"
            panelClassnames="-translate-x-3/4 xs:left-1/2 xs:-translate-x-1/2"
            messages={[{ title: 'Estimated Rewards', body: GET_ESTIMATED_REWARDS_MSG() }]}
          />
        </CardLabel>
        <CardValue>
          {deposits} USD /{' '}
          {rewards} {symbol}{' '}
          <span>
            {parsedUserInput.gt(0) && calcPeriodInDays > 0 ? `in ${safeNumeral(calcPeriodInDays, '0')} day${calcPeriodInDays > 1 ? 's' : ''}` : ''}
          </span>
        </CardValue>
      </RewardsTextContainer>
    </EstimatedRewardsContainer>
  )
}

const EstimatedRewardsContainer = styled.div`
  ${tw`h-120px shadow-all-xs my-6 border border-lightGray rounded flex flex-row tracking-wide`}
`

const ColoredDiv = styled.div`
  ${tw`rounded-l-sm h-full bg-radicalRed w-4`}
`

const Icon = styled.img`
  ${tw`mx-4 w-0`}
  ${tw`sm:w-auto`}
`

const RewardsTextContainer = styled.div`
  ${tw`flex flex-col my-auto`}
`
