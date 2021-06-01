import React, { useContext } from 'react';
import styled from 'styled-components/macro';
import Web3Context from '../context/Web3Context';
import { displayAddr } from '../utils/formatDisplayAddress';
import { Paragraph } from '../styling/styles'
import { NamedColors } from '../styling/colors'

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
  cursor: pointer;
  float: right;
  padding: 18px 26px;
  border-radius: 0px 0px 0px 24px;
  border-width: 0;
  background-color: ${NamedColors.RADICAL_RED};
  :hover {
    background-color: ${NamedColors.AMARANTH};
  }
`
