import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import logo from 'assets/wordmark-seamless.svg'
import { Mode } from '../constants'
import { HeaderWalletButton } from './HeaderWalletButton'
import { HeaderToggle } from './HeaderToggle'
import { HeaderNetworkSelect } from './HeaderNetworkSelect'

const SEAMLESS_INTERFACE_URL = `https://app.seamlessprotocol.com`

export const Header = () => {
  const { mode, toggleMode } = useContext(AppContext)
  return (
    <Container>
      <LeftContainer>
        <LogoSpan>
          <a href={SEAMLESS_INTERFACE_URL}>
            <LogoImage src={logo} alt="Seamless" />
          </a>
        </LogoSpan>
        <LeftLinkContainer>
          <a href={`${SEAMLESS_INTERFACE_URL}`}>
            <span className="text-white text-[6px] font-bold md:text-sm">Dashboard</span>
          </a>
          <a href={`${SEAMLESS_INTERFACE_URL}/markets`}>
            <span className="text-white text-[6px] font-bold md:text-sm">Markets</span>
          </a>
          <div>
            <span className="text-white text-[6px] font-bold underline cursor-pointer md:text-sm">Staking Farms</span>
          </div>
        </LeftLinkContainer>
      </LeftContainer>
      <MiddleContainer>
        <MiddleLinkContainer>
          <a href={`${SEAMLESS_INTERFACE_URL}`}>
            <span className="text-white text-[6px] font-bold md:text-sm">Dashboard</span>
          </a>
          <a href={`${SEAMLESS_INTERFACE_URL}/markets`}>
            <span className="text-white text-[6px] font-bold md:text-sm">Markets</span>
          </a>
          <div>
            <span className="text-white text-[6px] font-bold underline cursor-pointer md:text-sm">Staking Farms</span>
          </div>
        </MiddleLinkContainer>
        <HeaderToggle enabled={mode === Mode.VAULTS} toggle={toggleMode} options={['Single Farm View', 'Asset View']} />
      </MiddleContainer>
      <RightContainer>
        <HeaderNetworkSelect />
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const LogoImage = styled.img`
  ${tw`w-full h-36 -my-16 -ml-2 sm:ml-0`}
`

const LinkContainer = styled.div`
  ${tw`flex flex-wrap justify-center gap-1 md:flex-col md:flex-row md:gap-2 lg:gap-4 xl:gap-8`}
`

const LeftLinkContainer = styled(LinkContainer)`
  ${tw`hidden lg:flex`}
`

const MiddleLinkContainer = styled(LinkContainer)`
  ${tw`lg:hidden`}
`

const Container = styled.div`
  ${tw`shadow-sm flex flex-wrap py-1 -mt-1 h-fit text-white bg-header`}
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw`ml-2 p-3 text-3xl`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto justify-center items-center md:gap-2 lg:gap-4 xl:gap-8 `}
  ${tw`header-wrap:w-4/12`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3 py-2 gap-4`}
  ${tw`header-wrap:py-0 header-wrap:max-w-[830px] header-wrap:mx-auto header-wrap:order-2 header-wrap:w-1/3 xl:w-4/12`}
`
const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto flex flex-wrap`}
  ${tw`header-wrap:ml-0 header-wrap:order-3 header-wrap:w-4/12`}
`
