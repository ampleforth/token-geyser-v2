import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import Web3Context from 'context/Web3Context'
import { displayAddr } from 'utils/formatDisplayAddress'
import { Paragraph } from 'styling/styles'
import { NamedColors } from 'styling/colors'

export const HeaderWalletButton = () => {
  const { selectWallet, address } = useContext(Web3Context)

  return (
    <ButtonContainer>
      <Button onClick={selectWallet}>
        <Paragraph autoCapitalize="yes" color={NamedColors.WHITE}>
          {address ? displayAddr(address) : 'CONNECT'}
        </Paragraph>
      </Button>
    </ButtonContainer>
  )
}

const ButtonContainer = styled.div`
  ${tw`w-6/12 flex`}
`

// const pink = `bg-basePink hover:bg-[#FF6ED7/50]`
const Button = styled.button`
  ${tw`w-full px-8 py-4 rounded-bl-2xl float-right bg-basePink`}
  ${tw`sm:px-14 sm:py-5`}
  ${tw`hover:bg-[#FF6ED750]`}
`
