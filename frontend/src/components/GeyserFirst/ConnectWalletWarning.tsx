import tw from 'twin.macro'
import styled from 'styled-components/macro'

interface Props {
  onClick: () => void
}

export const ConnectWalletWarning: React.FC<Props> = ({ onClick }) => (
  <ConnectWalletWarningContainer>
    <ColoredDiv />
    <Content>
      <MessageContainer>
        <Message>Connect Your Ethereum Wallet</Message>
      </MessageContainer>
      <ButtonWrapper>
        <Button onClick={onClick}>Connect</Button>
      </ButtonWrapper>
    </Content>
  </ConnectWalletWarningContainer>
)

const Content = styled.div`
  ${tw`flex flex-row flex-grow text-white bg-secondary font-bold`}
`

const ConnectWalletWarningContainer = styled.div`
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
  ${tw`uppercase font-bold bg-secondaryDark text-white w-120px h-40px mt-5 rounded`}
  ${tw`sm:text-sm`}
  ${tw`hover:border hover:border-white cursor-pointer`}
`

const MessageContainer = styled.div`
  ${tw`flex flex-row flex-grow w-8/12`}
`
