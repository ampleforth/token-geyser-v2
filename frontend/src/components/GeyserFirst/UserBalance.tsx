import { BigNumber, BigNumberish } from 'ethers'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { formatAmount } from 'utils/amount'

interface Props {
  parsedAmount: BigNumber
  currentAmount: BigNumber
  decimals: number
  symbol: string
  isStakingAction: boolean
  poolAddress?: string
}

export const UserBalance: React.FC<Props> = ({
  parsedAmount,
  currentAmount,
  decimals,
  symbol,
  isStakingAction,
  poolAddress,
}) => {
  const formatDisplayAmount = (amt: BigNumberish, sym: string) => (
    <BalLink href={poolAddress} target="_blank" rel="noreferrer">
      {formatAmount(amt, decimals)} {sym}
    </BalLink>
  )

  if (isStakingAction) {
    const avail = currentAmount.sub(parsedAmount)
    return (
      <FlexDiv>
        <Text>Available balance: {formatDisplayAmount(avail.lte(0) ? 0 : avail, symbol)}</Text>
      </FlexDiv>
    )
  } else {
    return (
      <FlexDiv>
        {parsedAmount.isZero() ? (
          <Text>Staked balance: {formatDisplayAmount(currentAmount, symbol)}</Text>
        ) : (
          <Text>Remaining staked balance: {formatDisplayAmount(currentAmount.sub(parsedAmount), symbol)}</Text>
        )}
      </FlexDiv>
    )
  }
}

const Text = styled.span`
  ${tw`text-xs sm:text-sm`}
`

const BalLink = styled.a`
  ${tw`hover:underline`}
`

const FlexDiv = styled.div`
  ${tw`flex`}
`
