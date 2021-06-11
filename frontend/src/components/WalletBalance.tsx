import { BigNumber, BigNumberish } from 'ethers'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { formatAmount } from '../utils/amount'

interface Props {
  parsedAmount: BigNumber
  walletAmount: BigNumber
  decimals: number
  symbol: string
}

export const WalletBalance: React.FC<Props> = ({ parsedAmount, walletAmount, decimals, symbol }) => {
  const formatDisplayAmount = (amt: BigNumberish) => formatAmount(amt, decimals, symbol)
  // const userStake = BigNumber.from(amountOrZero(currentLock?.amount))
  return (
    <FlexDiv>
      {parsedAmount.isZero() ? (
        <>
          <span>Wallet balance: {formatDisplayAmount(walletAmount)} (BPT)</span>
          {/* <div>Current stake: {formatDisplayAmount(userStake)}</div> */}
        </>
      ) : (
        <>
          <span>New wallet balance: {formatDisplayAmount(walletAmount.sub(parsedAmount))} (BPT)</span>
          {/* <div>New stake: {formatDisplayAmount(userStake.add(parsedAmount))}</div> */}
        </>
      )}
    </FlexDiv>
  )
}

const FlexDiv = styled.div`
  ${tw`flex font-roboto font-bold`}
`
