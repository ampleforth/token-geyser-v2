import Web3Context from 'context/Web3Context'
import { GeyserContext } from 'context/GeyserContext'
import { VaultContext } from 'context/VaultContext'
import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { Tab } from '@headlessui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HeaderWalletButton } from './HeaderWalletButton'

export const HeaderTab: React.FC = () => {
  const { selectedGeyserConfig, getDefaultGeyserConfig } = useContext(GeyserContext)
  const location = useLocation()
  const navigate = useNavigate()

  const defaultGeyser = getDefaultGeyserConfig()
  let selectedIndex = 0
  if (/^\/geysers\/[^/]+$/.test(location.pathname)) {
    selectedIndex = 1
  } else if (location.pathname === '/vault') {
    selectedIndex = 2
  }
  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={(index) => {
        if (index === 0) {
          navigate('/')
        } else if (index === 1) {
          navigate(`/geysers/${selectedGeyserConfig?.slug || defaultGeyser?.slug}`)
        } else if (index === 2) {
          navigate('/vault')
        }
      }}
    >
      <Tab.List className="flex items-center">
        <HeaderTabItem className="hidden" isSelected={selectedIndex === 0}>
          Home
        </HeaderTabItem>
        <HeaderTabItem isSelected={selectedIndex === 1}>Stake</HeaderTabItem>
        <HeaderTabItem isSelected={selectedIndex === 2}>Vault</HeaderTabItem>
      </Tab.List>
    </Tab.Group>
  )
}

export const Header = () => {
  const { ready } = useContext(Web3Context)
  const { vaults, loading } = useContext(VaultContext)
  const navigate = useNavigate()
  const showTabs = ready && (loading || vaults.length > 0)
  if (showTabs) {
    return (
      <Container>
        <LeftContainer>
          <LogoSpan onClick={() => navigate('/')}>Λ</LogoSpan>
        </LeftContainer>
        <MiddleContainer>
          <HeaderTab />
        </MiddleContainer>
        <RightContainer>
          <HeaderWalletButton />
        </RightContainer>
      </Container>
    )
  }

  return (
    <Container>
      <LeftContainer />
      <MiddleContainer>
        <LogoSpan onClick={() => navigate('/')}>Λ</LogoSpan>
      </MiddleContainer>
      <RightContainer>
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const Container = styled.div`
  ${tw`flex flex-wrap py-1 h-fit items-center justify-center`}
  ${tw`bg-white border-b border-lightGray shadow py-2`}
`

const LogoSpan = styled.a`
  font-family: 'Coromont Garamond';
  ${tw`p-3 text-3xl w-full`}
  ${tw`cursor-pointer`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
  ${tw`w-4/12 text-right`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3 py-6`}
  ${tw`py-0 max-w-md mx-auto order-2 w-1/3 xl:w-4/12 text-center`}
`

const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto flex flex-wrap`}
  ${tw`ml-0 order-3 w-4/12`}
`

const HeaderTabItem = styled(Tab).withConfig({
  shouldForwardProp: (prop: string | number) => prop !== 'isSelected',
})<{ isSelected: boolean }>`
  ${tw`font-normal tracking-wider px-4 py-2 text-center cursor-pointer`}
  ${({ isSelected }) => (isSelected ? tw`text-black font-bold` : tw`text-gray hover:text-black`)};
  ${({ isSelected }) => isSelected && `background-color: #f9f9f9;`}
  ${tw`focus:outline-none focus:ring-0`}
`
