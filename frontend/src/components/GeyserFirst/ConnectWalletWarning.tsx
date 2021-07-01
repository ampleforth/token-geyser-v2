import tw from 'twin.macro'
import styled from 'styled-components/macro'
import warning from 'assets/warning.svg'

interface Props {
  onClick: () => void
}

export const ConnectWalletWarning: React.FC<Props> = ({ onClick }) => (
  <ConnectWalletWarningContainer>
    <ColoredDiv />
    <Content>
      <MessageContainer>
        <Img src={warning} alt="Warning" />
        <Message>Connect Your Ethereum Wallet</Message>
      </MessageContainer>
      <ButtonWrapper>
        <Button onClick={onClick}>Connect</Button>
      </ButtonWrapper>
    </Content>
  </ConnectWalletWarningContainer>
)

const Content = styled.div`
  ${tw`flex flex-row flex-grow`}
`

const ConnectWalletWarningContainer = styled.div`
  ${tw`h-80px shadow-all-xs mt-1 mb-5 border border-primary rounded flex flex-row tracking-wider`}
`

const ColoredDiv = styled.div`
  ${tw`h-full w-4 rounded-l-sm bg-primary`}
`

const Img = styled.img`
  ${tw`w-0 mx-4 h-3/5 my-auto`}
  ${tw`sm:mx-8 sm:w-auto`}
`

const Message = styled.span`
  ${tw`my-auto text-primary`}
`

const ButtonWrapper = styled.div`
  ${tw`flex-grow`}
`

const Button = styled.button`
  ${tw`uppercase font-bold bg-primary text-secondary w-full h-full`}
  ${tw`sm:text-lg`}
`

const MessageContainer = styled.div`
  ${tw`flex flex-row flex-grow`}
`
