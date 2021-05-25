import React from 'react'
import styled from 'styled-components/macro'
import { NamedColors } from '../styling/colors'
import { Paragraph } from '../styling/styles'

// assumes options are unique
interface Props {
  toggleOption: (option: string) => void
  options: string[]
  activeOption: string
}

export const ToggleView: React.FC<Props> = ({ options, activeOption, toggleOption }) => (
  <ToggleContainer>
    {options.map((option) => (
      <Option key={option} selected={activeOption === option} onClick={() => toggleOption(option)}>
        {option}
      </Option>
    ))}
  </ToggleContainer>
)

interface OptionProps {
  selected: boolean
  onClick: () => void
}

// TODO: toggle theme colors
const Option: React.FC<OptionProps> = ({ children, selected, onClick }) => (
  <ToggleButton onClick={onClick} color={selected ? NamedColors.BLACK : NamedColors.WHITE}>
    <Paragraph color={selected ? NamedColors.WHITE : NamedColors.BLACK}>{children}</Paragraph>
  </ToggleButton>
)

const ToggleContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  margin: auto;
`

const ToggleButton = styled.button`
  cursor: pointer;
  width: 140px;
  height: 60px;
  border-radius: 8px;
  margin: auto;
  padding: 18px;
  margin-left: 1em;
  margin-right: 1em;
  border: 1px solid ${NamedColors.BLACK};
  background-color: ${(props) => props.color};
`
