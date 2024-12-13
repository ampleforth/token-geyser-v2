import React from 'react'
import { BigNumber } from 'ethers'
import tw from 'twin.macro'
import styled from 'styled-components/macro'

interface Props {
  link: string
  balance: BigNumber
  staked: BigNumber
}

export const StakeWarning: React.FC<Props> = ({ link, balance, staked }) => {
  if (balance.gte(0)) {
    return <></>
  }

  return (
    <StakeWarningContainer>
      <ColoredDiv />
      <Content>
        <MessageContainer>
          <Message>Insufficient balance</Message>
        </MessageContainer>
        <ButtonWrapper>
          <Button onClick={() => window.open(link, '_blank')}>{staked.lte(0) ? 'Get LP' : 'Get more'}</Button>
        </ButtonWrapper>
      </Content>
    </StakeWarningContainer>
  )
}

const Content = styled.div`
  ${tw`flex flex-row flex-grow text-white bg-secondary font-bold`}
`

const StakeWarningContainer = styled.div`
  ${tw`h-80px mt-1 mb-5 border border-lightGray flex flex-row tracking-wider`}
`

const ColoredDiv = styled.div`
  ${tw`h-full w-2 bg-secondaryDark`}
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

const MessageContainer = styled.div`
  ${tw`flex flex-row flex-grow w-8/12`}
`
