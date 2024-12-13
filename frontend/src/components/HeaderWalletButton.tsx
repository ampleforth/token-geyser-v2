import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import Web3Context from 'context/Web3Context'
import { AppContext } from 'context/AppContext'
import { displayAddr } from 'utils/formatDisplayAddress'
import { NamedColors } from 'styling/colors'
import { Mode } from '../constants'

export const HeaderWalletButton = () => {
  const { connectWallet, disconnectWallet, wallet, address } = useContext(Web3Context)
  const { mode, toggleMode } = useContext(AppContext)

  const handleButtonClick = async () => {
    if (wallet) {
      await disconnectWallet(wallet)
      if (mode !== Mode.GEYSERS) {
        toggleMode()
      }
    } else {
      connectWallet()
    }
  }

  return (
    <ButtonContainer>
      <Button onClick={handleButtonClick} connected={!!address}>
        <span autoCapitalize="yes" color={NamedColors.WHITE}>
          {address ? displayAddr(address) : 'CONNECT'}
        </span>
      </Button>
    </ButtonContainer>
  )
}

const ButtonContainer = styled.div`
  ${tw`flex mt-1 mr-3`}
`

const Button = styled.button<{ connected: boolean }>`
  ${tw`w-full border-lightGray rounded w-120px h-40px text-white font-bold text-sm transition-all duration-300 ease-in-out`}
  ${({ connected }) => (connected ? tw`bg-secondary` : tw`bg-primary hover:bg-primaryDark`)}
`
