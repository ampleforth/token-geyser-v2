import tw from 'twin.macro'
import styled from 'styled-components/macro'
import warning from 'assets/warning.svg'

export const ConnectWalletWarning = () => {
  return (
    <ConnectWalletWarningContainer>
      <ColoredDiv />
      <Img src={warning} alt="Warning" />
      <Message>Connect Your Ethereum Wallet</Message>
      <Button>Connect</Button>
    </ConnectWalletWarningContainer>
  )
}

const ConnectWalletWarningContainer = styled.div`
  height: 80px;
  ${tw`shadow-md mt-1 mb-5 border border-primary rounded flex flex-row font-roboto tracking-wider`}
`

const ColoredDiv = styled.div`
  width: 1em;
  height: 100%;
  ${tw`shadow-md rounded-l bg-primary`}
`

const Img = styled.img`
  ${tw`mx-8 h-3/5 my-auto`}
`

const Message = styled.span`
  ${tw`my-auto text-primary`}
`

const Button = styled.button`
  ${tw`justify-self-end h-full`}
`
