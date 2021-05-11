import React from 'react';
import styled from 'styled-components/macro';
import { VaultMetaData } from '../../utils/types';
import { displayAddr } from '../../utils/formatDisplayAddress';
import { stateToColor } from '../../utils/constants';
import { LeftAlign, RightAlign } from '../styles';

interface VaultRowProps {
  vault: VaultMetaData;
}

const VaultRow: React.FC<VaultRowProps> = (props) => {
  const { vault: { id, state }} = props;

  return (
    <VaultClickable>
      <LeftAlign>
        {displayAddr(id)}
      </LeftAlign>
      <RightAlign>
        <ColoredDot color={stateToColor[state]} />
      </RightAlign>
    </VaultClickable>
  )
}

export default VaultRow;

const VaultClickable = styled.button`
  width: 100%;
  font-size: 1.2rem;
  display: grid;
  grid-template-columns: 3fr 1fr;
  vertical-align: middle;
  justify-content: center;
  align-content: center;
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 10px;
  cursor: pointer;
  background-color: white;
  padding: 4px 16px;
  transition: 0.3s;
  :hover {
    background-color: #ddd;
  }
`

const ColoredDot = styled.span`
  height: 20px;
  width: 20px;
  background-color: ${props => props.color};
  border-radius: 50%;
  display: inline-block;
`
