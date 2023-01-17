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
  poolAddress?:string
}

export const UserBalance: React.FC<Props> = ({ parsedAmount, currentAmount, decimals, symbol, isStakingAction, poolAddress }) => {
  const formatDisplayAmount = (amt: BigNumberish, sym:string) => (
    <a href={poolAddress} target="_blank" rel="noreferrer">
      {formatAmount(amt, decimals)} {sym}
    </a>
  )
  return (
    <FlexDiv>
      {parsedAmount.isZero() ? (
          <Text>{isStakingAction ? 'Available' : 'Staked'} balance: {formatDisplayAmount(currentAmount, symbol)}</Text>
      ) : (
        <Text>New {isStakingAction ? 'available' : 'stake'} balance: {formatDisplayAmount(currentAmount.sub(parsedAmount), symbol)}</Text>
      )}
    </FlexDiv>
  )
}

const Text = styled.span`
  ${tw`text-xs sm:text-sm`}
`

const FlexDiv = styled.div`
  ${tw`flex`}
`
