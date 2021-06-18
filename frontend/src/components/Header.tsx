import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { HeaderWalletButton } from './HeaderWalletButton'

export const Header = () => (
    <Container>
      <LeftContainer>
        <LogoSpan>Λ</LogoSpan>
        <HeaderLabel>Geyser</HeaderLabel>
      </LeftContainer>
      <RightContainer>
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )

const Container = styled.div`
  ${tw`flex flex-wrap py-1 -mt-1 h-fit`}
`

const HeaderLabel = styled.span`
  ${tw`font-times italic text-2xl pt-5`}
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw`ml-4 p-5 text-3xl`}
  ${tw`header-wrap:ml-20`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
`

const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto`}
`
