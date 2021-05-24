import React, { useContext } from 'react';
import styled from 'styled-components/macro';
import Web3Context from '../context/Web3Context';
import { Paragraph } from '../styling/styles'
import { create } from '../sdk';
import { NamedColors } from '../styling/colors'

interface Props {}

export const MintVaultButton: React.FC<Props> = () => {
  const { signer, ready, selectWallet } = useContext(Web3Context)

  const mintVault = () => signer && create(signer)

  const handleMintVault = () => ((ready ? mintVault() : selectWallet()))

  return (
    <MintVault onClick={handleMintVault}>
      <Paragraph color={NamedColors.WHITE}>
        {ready ? 'Mint a vault' : 'Connect'}
      </Paragraph>
    </MintVault>
  )
}

const MintVault = styled.button`
  cursor: pointer;
  width: 90%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin: auto;
  border: 1px solid ${NamedColors.WHITE};
  background-color: ${NamedColors.ELECTRICAL_VIOLET};
  :hover {
    background-color: ${NamedColors.RADICAL_RED};
  }
`
