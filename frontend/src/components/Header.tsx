import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import logo from 'assets/wordmark-seamless.svg'
import { Mode } from '../constants'
import { HeaderWalletButton } from './HeaderWalletButton'
import { HeaderToggle } from './HeaderToggle'
import { HeaderNetworkSelect } from './HeaderNetworkSelect'

export const Header = () => {
  const { mode, toggleMode } = useContext(AppContext)
  return (
    <Container>
      <LeftContainer>
        <LogoSpan>
          <LogoImage src={logo} alt="Seamless" />
        </LogoSpan>
      </LeftContainer>
      <MiddleContainer>
        <HeaderToggle enabled={mode === Mode.VAULTS} toggle={toggleMode} options={['Geyser View', 'Vault View']} />
      </MiddleContainer>
      <RightContainer>
        <HeaderNetworkSelect />
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const LogoImage = styled.img`
  ${tw`w-auto h-48 -my-16`}
`

const Container = styled.div`
  ${tw`shadow-sm flex flex-wrap py-1 -mt-1 h-fit text-white`}
  background: linear-gradient(248.86deg, #cdf3a2 5%, #21e1e1 15%, #d69bdf 40%, #506ff3 91%);
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw`ml-2 p-3 text-3xl`}
  ${tw`header-wrap:ml-20`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
  ${tw`header-wrap:w-4/12`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3 py-6`}
  ${tw`header-wrap:py-0 header-wrap:max-w-830px header-wrap:mx-auto header-wrap:order-2 header-wrap:w-1/3 xl:w-4/12`}
`
const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto flex flex-wrap`}
  ${tw`header-wrap:ml-0 header-wrap:order-3 header-wrap:w-4/12`}
`
