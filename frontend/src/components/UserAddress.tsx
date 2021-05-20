import React, { useContext } from 'react';
import styled from 'styled-components/macro';
import Web3Context from '../context/Web3Context';
import { displayAddr } from '../utils/formatDisplayAddress';
import { WhiteText } from './styles';

interface UserAddressProps {}

const UserAddress: React.FC<UserAddressProps> = () => {
  const { selectWallet, wallet, address } = useContext(Web3Context);

  return (
    <div>
      <Button onClick={selectWallet}>
        <WhiteText>
          {wallet?.provider && address
            ? displayAddr(address)
            : 'CONNECT'}
        </WhiteText>
      </Button>
    </div>
  );
}

export default UserAddress;

const Button = styled.button`
  background-color: #FF2D55;
  border-radius: 0px 0px 0px 24px;
  border-width: 0;
  cursor: pointer;
  :hover {
    background-color: #ee2a4f;
  }
  float: right;
  padding: 0px 20px;
`
