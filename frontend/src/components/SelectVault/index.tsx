import React, { useContext } from 'react';
import styled from 'styled-components/macro';
import Web3Context from '../../context/Web3Context';
import { VaultMetaData } from '../../utils/types';
import VaultRow from '../VaultRow';

interface SelectVaultProps {
  vaults: VaultMetaData[];
}

const SelectVault: React.FC<SelectVaultProps> = ({ vaults }) => {
  const { ready } = useContext(Web3Context);

  if (!ready)
    return (
      <TextWrapper>
        <h1>Connect to your ethereum wallet</h1>
      </TextWrapper>
    );

  return (
    vaults.length > 0
    ? <SelectWrapper>
        {vaults.map(vault => <VaultRow vault={vault} key={vault.id} />)}
      </SelectWrapper>
    : <TextWrapper>
        <h1>No vaults yet</h1>
      </TextWrapper>
  );
}

export default SelectVault;

const SelectWrapper = styled.div`
  padding: 20px;
  overflow-y: hidden;
  :hover {
    overflow-y: overlay;
  }
`

const TextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
`
