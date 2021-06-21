import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { MODE } from '../constants'
import { HeaderWalletButton } from './HeaderWalletButton'
import { HeaderToggle } from './HeaderToggle'

export const Header = () => {
  const { mode, toggleMode } = useContext(AppContext)
  return (
    <Container>
      <LeftContainer>
        <LogoSpan>Λ</LogoSpan>
      </LeftContainer>
      <MiddleContainer>
        <HeaderToggle enabled={mode === MODE.Vaults} toggle={toggleMode} options={['Vault View', 'Geyser View']} />
      </MiddleContainer>
      <RightContainer>
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const Container = styled.div`
  ${tw`shadow-sm flex flex-wrap py-1 -mt-1 h-fit`}
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw`ml-2 p-3 text-3xl`}
  ${tw`header-wrap:ml-20`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
  ${tw`header-wrap:w-2/12`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3 py-6`}
  ${tw`header-wrap:py-0 header-wrap:max-w-830px header-wrap:mx-auto header-wrap:order-2 header-wrap:w-1/3 xl:w-8/12`}
`
const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto`}
  ${tw`header-wrap:ml-0 header-wrap:order-3 header-wrap:w-2/12`}
`
