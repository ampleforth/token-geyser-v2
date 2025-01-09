import React from 'react'
import { BigNumber } from 'ethers'
import tw from 'twin.macro'
import styled from 'styled-components/macro'

interface Props {
  poolAddress: string
  balance: BigNumber
  staked: BigNumber
  otherActiveLock: boolean
}

export const StakeWarning: React.FC<Props> = ({ poolAddress, balance, staked, otherActiveLock }) => {
  const renderStakeWarning = (message: string, buttonLabel: string, url: string, newTab: bool) => (
    <StakeWarningContainer>
      <ColoredDiv />
      <Content>
        <MessageContainer>
          <Message>{message}</Message>
        </MessageContainer>
        <ButtonWrapper>
          <Button onClick={() => window.open(url, newTab ? '_blank' : '_self')}>{buttonLabel}</Button>
        </ButtonWrapper>
      </Content>
    </StakeWarningContainer>
  )

  if (otherActiveLock) {
    return renderStakeWarning('Your tokens are staked elsewhere', 'Unstake', '/', false)
  }

  if (balance.gte(0)) {
    return null
  }

  const buttonLabel = staked.lte(0) ? 'Get LP' : 'Get more'
  return renderStakeWarning('Insufficient balance', buttonLabel, poolAddress, true)
}

const StakeWarningContainer = styled.div`
  ${tw`h-80px mt-1 mb-5 border border-lightGray flex flex-row tracking-wider`}
`

const ColoredDiv = styled.div`
  ${tw`h-full w-2 bg-secondaryDark`}
`

const Content = styled.div`
  ${tw`flex flex-row flex-grow text-white bg-secondary font-bold`}
`

const MessageContainer = styled.div`
  ${tw`flex flex-row flex-grow w-8/12`}
`

const Message = styled.span`
  ${tw`ml-5 my-auto`}
`

const ButtonWrapper = styled.div`
  ${tw`flex-grow w-2/12`}
`

const Button = styled.button`
  ${tw`uppercase font-bold bg-secondaryDark text-white w-btnsm h-btnsm mt-5 rounded flex-grow`}
  ${tw`sm:text-sm`}
  ${tw`hover:border hover:border-white cursor-pointer`}
`
