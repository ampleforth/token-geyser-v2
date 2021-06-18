import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import styled from 'styled-components/macro'
import { ResponsiveSubText } from 'styling/styles'
import tw from 'twin.macro'
import { MODE } from '../constants'
import { HeaderWalletButton } from './HeaderWalletButton'
import { ToggleView } from './ToggleView'

export const Header = () => {
  const { mode, toggleMode } = useContext(AppContext)
  return (
    <Container>
      <LeftContainer>
        <LogoSpan>Λ</LogoSpan>
        <HeaderLabel>Geyser</HeaderLabel>
      </LeftContainer>
      <MiddleContainer>
        <ToggleView compact enabled={mode === MODE.Vaults} options={['Vaults','Geysers']} toggle={toggleMode}  /> 
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

const MiddleContainer = styled.div`
  ${ResponsiveSubText}
  ${tw`flex m-auto w-36 max-w-830px`}
  ${tw`sm:w-52 lg:w-1/5`}
`

const RightContainer = styled.div`
  ${tw`flex w-auto`}
`
