import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import Web3Context from '../context/Web3Context'
import { displayAddr } from '../utils/formatDisplayAddress'
import { Paragraph } from '../styling/styles'
import { NamedColors } from '../styling/colors'
import tw from 'twin.macro'

interface Props {}

export const HeaderWalletButton: React.FC<Props> = () => {
  const { selectWallet, address } = useContext(Web3Context)

  return (
    <div>
      <StickyButton onClick={selectWallet}>
        <Paragraph autoCapitalize="yes" color={NamedColors.WHITE}>
          {address ? displayAddr(address) : 'CONNECT'}
        </Paragraph>
      </StickyButton>
    </div>
  )
}

const StickyButton = styled.button`
  ${tw`px-6 py-4 sm:px-14 sm:py-5 rounded-bl-2xl float-right bg-radicalRed hover:bg-amaranth`}
`
