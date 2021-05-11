import React, { useContext } from 'react';
import styled from 'styled-components/macro';
import Web3Context from '../../context/Web3Context';
import { WhiteText } from '../styles';
import { create } from '../../sdk';

interface MintVaultButtonProps {}

const MintVaultButton: React.FC<MintVaultButtonProps> = () => {
  const { signer, ready, selectWallet } = useContext(Web3Context);

  const mintVault = () => {
    if (signer) create(signer);
  }
  return (
    <ButtonWrapper>
      <Button onClick={ready ? mintVault : selectWallet}>
        <WhiteText>
          {ready ? 'Mint a vault' : 'Connect'}
        </WhiteText>
      </Button>
    </ButtonWrapper>
  );
}

export default MintVaultButton;

const Button = styled.button`
  width: 100%;
  height: 60px;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #ddd;
  background-color: #912dff;
  :hover {
    background-color: #FF2D55;
  }
`

const ButtonWrapper = styled.div`
  padding: 20px;
`
