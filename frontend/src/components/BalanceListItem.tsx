import { formatUnits } from 'ethers/lib/utils';
import React from 'react';
import styled from 'styled-components/macro';
import { NamedColors } from '../styling/colors';
import { Aligned } from '../styling/mixins';
import { TokenBalance } from '../types';

interface BalanceListItemProps {
  tokenBalance: TokenBalance
}

const BalanceListItem: React.FC<BalanceListItemProps> = ({ tokenBalance }) => {
  return (
    <BalanceItem>
      <LeftAlign>
        {tokenBalance.name}
      </LeftAlign>
      <RightAlign>
        {formatUnits(tokenBalance.balance)}
      </RightAlign>
    </BalanceItem>
  );
}

export default BalanceListItem;

const BalanceItem = styled.div`
  font-size: 1rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  vertical-align: middle;
  justify-content: center;
  align-content: center;
  border: 1px solid ${NamedColors.ALTO};
  border-radius: 10px;
  background-color: ${NamedColors.WHITE};
  padding: 12px 16px;
  margin: 8px;
`

const LeftAlign = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  ${Aligned('left')};
`

const RightAlign = styled.div`
  margin-top: auto;
  margin-bottom: auto;
  ${Aligned('right')};
`
