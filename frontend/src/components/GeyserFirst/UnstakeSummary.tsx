import { useContext, useState, useEffect } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { BigNumber } from 'ethers'
import { GeyserContext } from 'context/GeyserContext'
import { StatsContext } from 'context/StatsContext'
import { CardValue, CardLabel } from 'styling/styles'
import { amountOrZero } from 'utils/amount'
import { formatWithDecimals } from 'utils/numeral'

interface Props {
  userInput: string
  parsedUserInput: BigNumber
}

export const UnstakeSummary: React.FC<Props> = ({ userInput, parsedUserInput }) => {
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol: rewardTokenSymbol },
      stakingTokenInfo: { symbol: stakingTokenSymbol },
    },
  } = useContext(GeyserContext)
  const { computeRewardsFromUnstake } = useContext(StatsContext)

  const [rewardAmount, setRewardAmount] = useState<string>('0.00')

  useEffect(() => {
    (async () => {
      setRewardAmount(formatWithDecimals(`${await computeRewardsFromUnstake(parsedUserInput)}`, 2))
    })();
  }, [parsedUserInput])

  return (
    <Container>
      <SummaryCard>
        <Content>
          <Label>
            Amount to Unstake
          </Label>
          <Value>
            <Amount>{`${formatWithDecimals(amountOrZero(userInput).toString(), 2)} `}</Amount>
            <span>{stakingTokenSymbol}</span>
          </Value>
        </Content>
      </SummaryCard>
      <SummaryCard>
        <Content>
          <Label>
            Rewards Claimed
          </Label>
          <Value>
            <Amount>{`${rewardAmount} `}</Amount>
            <span>{rewardTokenSymbol}</span>
          </Value>
        </Content>
      </SummaryCard>
    </Container>
  )
}

const Container = styled.div`
  ${tw`grid grid-cols-2 gap-x-4 my-6`}
`

const SummaryCard = styled.div`
  ${tw`h-120px shadow-all-xs border border-lightGray rounded flex flex-col my-auto tracking-wide`}
`

const Label = styled(CardLabel)`
  ${tw`text-sm sm:text-base text-left`}
`

const Value = styled(CardValue)`
  ${tw`text-sm sm:text-base flex-wrap text-left`}
`

const Amount = styled.span`
  ${tw`whitespace-pre-wrap`}
`

const Content = styled.div`
  ${tw`flex flex-col my-auto ml-4`}
`
