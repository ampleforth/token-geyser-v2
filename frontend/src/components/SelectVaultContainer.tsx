import { useLazyQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components/macro';
import { MintVaultButton } from './MintVaultButton';
import { SelectVault } from './SelectVault';
import Web3Context from '../context/Web3Context';
import { Vault, VaultMetaData } from '../utils/types';
import { GET_USER_VAULTS } from '../queries/vault';
import { VaultState } from '../utils/constants';

interface SelectVaultContainerProps {}

export const SelectVaultContainer: React.FC<SelectVaultContainerProps> = () => {

  const { address } = useContext(Web3Context);
  const [getVaults, { loading, data }] = useLazyQuery(GET_USER_VAULTS, { pollInterval: 5000 });
  const [vaults, setVaults] = useState<VaultMetaData[]>([]);

  useEffect(() => {
    if (address) getVaults({ variables: { id: address } });
  }, [address]);

  useEffect(() => {
    if (data && data.user) {
      const userVaults = data.user.vaults as Vault[];
      setVaults(
        (userVaults || []).map(vault => ({ id: vault.id, state: VaultState.INACTIVE })) // TODO: figure out state
      );
    }
  }, [data]);

  if (loading) return null;

  return (
    <Container>
      <Title>Select a vault</Title>
        <Box>
          <SelectVault vaults={vaults} />
          <MintVaultButton />
        </Box>
    </Container>
  );
}

const Container = styled.div`
  width: 640px;
  height: 80%;
  text-align: center;
  margin: auto;
`

const Box = styled.div`
  box-shadow: 0px -2px 25px -3px rgb(0 0 0 / 10%);
  border-radius: 10px;
  display: grid;
  grid-template-rows: 4fr 1fr;
  height: 70%;
`

const Title = styled.h2`
  font-size: 3rem;
`
