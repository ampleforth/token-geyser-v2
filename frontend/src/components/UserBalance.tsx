import { BigNumber, BigNumberish } from 'ethers'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { formatAmount } from '../utils/amount'

interface Props {
  parsedAmount: BigNumber
  currentAmount: BigNumber
  decimals: number
  symbol: string
  isStakingAction: boolean
}

export const UserBalance: React.FC<Props> = ({ parsedAmount, currentAmount, decimals, symbol, isStakingAction }) => {
  const formatDisplayAmount = (amt: BigNumberish) => formatAmount(amt, decimals)
  return (
    <FlexDiv>
      {parsedAmount.isZero() ? (
        <span>{isStakingAction ? 'Wallet' : 'Staked'} balance: {formatDisplayAmount(currentAmount)} ({symbol})</span>
      ) : (
        <span>New {isStakingAction ? 'wallet' : 'stake'} balance: {formatDisplayAmount(currentAmount.sub(parsedAmount))} ({symbol})</span>
      )}
    </FlexDiv>
  )
}

const FlexDiv = styled.div`
  ${tw`flex font-bold`}
`
