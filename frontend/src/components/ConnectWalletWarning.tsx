import tw from 'twin.macro'
import styled from 'styled-components/macro'
import warning from 'assets/warning.svg'

interface Props {
  onClick: () => void
}

export const ConnectWalletWarning: React.FC<Props> = ({ onClick }) => {
  return (
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
}

const Content = styled.div`
  ${tw`flex flex-row flex-grow`}
`

const ConnectWalletWarningContainer = styled.div`
  ${tw`h-80px shadow-md mt-1 mb-5 border border-primary rounded flex flex-row tracking-wider`}
`

const ColoredDiv = styled.div`
  width: 1em;
  height: 100%;
  ${tw`shadow-md rounded-l-sm bg-primary`}
`

const Img = styled.img`
  ${tw`w-0 mx-4 sm:mx-8 h-3/5 my-auto sm:w-auto`}
`

const Message = styled.span`
  ${tw`my-auto text-primary`}
`

const ButtonWrapper = styled.div`
  ${tw`flex-grow`}
`

const Button = styled.button`
  ${tw`sm:text-lg uppercase font-bold bg-primary text-secondary w-full h-full`}
`

const MessageContainer = styled.div`
  ${tw`flex flex-row flex-grow`}
`
