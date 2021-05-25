import React, { useState } from 'react';
import styled from 'styled-components/macro';
import { NamedColors } from '../styling/colors';
import { Paragraph } from '../styling/styles';

// requires that the tabs are unique
interface TabPaneProps {
  tabs: string[]
  onSelect: any;
}

export const TabPane: React.FC<TabPaneProps> = ({ tabs, onSelect }) => {
  const [selectedTab, setSelectedTab] = useState<string>(tabs.length > 0 ? tabs[0] : '');
  const handleSelect = (tab: string) => {
    setSelectedTab(tab)
    onSelect(tab)
  }
  return (
    <ButtonsContainer>
      {tabs.map(tab => <Tab selected={selectedTab === tab} onClick={() => handleSelect(tab)}>{tab}</Tab>)}
    </ButtonsContainer>
  );
}

interface TabProps {
  selected: boolean
  onClick: () => void
}

const Tab: React.FC<TabProps> = ({ children, selected, onClick }) => {
  return (
    <TabButton onClick={onClick} color={selected ? NamedColors.BLACK : NamedColors.WHITE}>
      <Paragraph color={selected ? NamedColors.WHITE : NamedColors.BLACK}>
        {children}
      </Paragraph>
    </TabButton>
  )
}

const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-left: 20%;
  margin-right: 20%;
  margin-bottom: 8px;
`

const TabButton = styled.button`
  cursor: pointer;
  width: 90%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin: auto;
  border: 1px solid ${NamedColors.BLACK};
  background-color: ${(props) => props.color};
`

