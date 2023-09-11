import { useContext, useState, useEffect } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { BigNumber } from 'ethers'
import { GeyserContext } from 'context/GeyserContext'
import { StatsContext } from 'context/StatsContext'
import { CardValue, CardLabel } from 'styling/styles'
import { amountOrZero } from 'utils/amount'
import { safeNumeral, formatWithDecimals } from 'utils/numeral'

interface Props {
  userInput: string
  parsedUserInput: BigNumber
}

export const UnstakeSummary: React.FC<Props> = ({ userInput, parsedUserInput }) => {
  const {
    selectedGeyserInfo: {
      rewardTokenInfo: { symbol: rewardTokenSymbol, price: rewardTokenPrice },
      stakingTokenInfo: { symbol: stakingTokenSymbol, price: stakingTokenPrice },
    },
  } = useContext(GeyserContext)
  const {
    geyserStats: { bonusRewards },
    computeRewardsFromUnstake,
    computeRewardsShareFromUnstake,
  } = useContext(StatsContext)

  const [rewardAmount, setRewardAmount] = useState<number>(0.0)
  const [rewardsShare, setRewardsShare] = useState<number>(0.0)

  const unstakeUSD = parseFloat(userInput) * stakingTokenPrice
  const rewardUSD = rewardAmount * rewardTokenPrice + bonusRewards.reduce((m, b) => m + rewardsShare * b.value, 0)

  useEffect(() => {
    ;(async () => {
      setRewardAmount(await computeRewardsFromUnstake(parsedUserInput))
      setRewardsShare(await computeRewardsShareFromUnstake(parsedUserInput))
    })()
  }, [parsedUserInput])

  return (
    <Container>
      <SummaryCard>
        <Content>
          <Label>
            Amount to Unstake
            {unstakeUSD > 0 ? <small>&nbsp;({safeNumeral(unstakeUSD, '0.00')} USD)</small> : <></>}
          </Label>
          <Value>
            <Amount>{formatWithDecimals(amountOrZero(userInput).toString())} </Amount>
            <span>{stakingTokenSymbol}</span>
          </Value>
        </Content>
      </SummaryCard>
      <SummaryCard>
        <Content>
          <Label>
            Rewards to Claim
            {rewardUSD > 0 ? <small>&nbsp;({safeNumeral(rewardUSD, '0.00')})</small> : <></>}
          </Label>
          <Value>
            <Amount>{safeNumeral(rewardAmount, '0.000')} </Amount>
            <span>{rewardTokenSymbol}</span>
          </Value>

          {bonusRewards.map((b) => (
            <Value key={b.symbol}>
              <Amount>{safeNumeral(rewardsShare * b.balance, '0.000')} </Amount>
              <span>{b.symbol}</span>
            </Value>
          ))}
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
