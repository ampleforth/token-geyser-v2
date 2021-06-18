import styled from 'styled-components/macro'
import tw from 'twin.macro'
import rewardSymbol from 'assets/rewardSymbol.svg'
import info from 'assets/info.svg'
import { useContext, useEffect, useState } from 'react'
import { StatsContext } from 'context/StatsContext'
import { formatWithDecimals } from 'utils/numeral'
import { BigNumber } from 'ethers'
import { CardValue, CardLabel } from '../styling/styles'
import { GeyserContext } from '../context/GeyserContext'

interface Props {
  parsedUserInput: BigNumber
}

export const EstimatedRewards: React.FC<Props> = ({ parsedUserInput }) => {
  const [rewards, setRewards] = useState<string>('0.00')
  const { rewardTokenInfo: { symbol } } = useContext(GeyserContext)
  const { computeRewardsFromAdditionalStakes, geyserStats: { calcPeriodInDays } } = useContext(StatsContext)

  useEffect(() => {
    (async () => {
      setRewards(formatWithDecimals(`${await computeRewardsFromAdditionalStakes(parsedUserInput)}`, 2))
    })();
  }, [parsedUserInput])

  return (
    <EstimatedRewardsContainer>
      <ColoredDiv />
      <Img src={rewardSymbol} alt="Rewards Symbol" className="w-0 sm:w-auto"/>
      <RewardsTextContainer>
        <CardLabel>
          Your Estimated Rewards <Img src={info} alt="Info" />
        </CardLabel>
        <CardValue>{rewards} {symbol} {parsedUserInput.gt(0) && calcPeriodInDays > 0 ? `in ${calcPeriodInDays} day${calcPeriodInDays > 1 ? 's' : ''}` : ''}</CardValue>
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

const Img = styled.img`
  ${tw`mx-4`}
`

const RewardsTextContainer = styled.div`
  ${tw`flex flex-col my-auto`}
`
