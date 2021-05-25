import React from 'react'
import styled from 'styled-components/macro'
import { NamedColors } from '../styling/colors'
import { LogoDiv } from '../styling/styles'

// TODO: Use spinner from tailwind
export const LoadingSpinner = () => {
  return (
    <Spinner className="animate-ping">
      <LogoDiv>Λ</LogoDiv>
    </Spinner>
  )
}

const Spinner = styled.div`
  display: flex;
  flex: row;
  fill: transparent;
  font-size: 1em;
  height: 100%;
  stroke: ${NamedColors.ELECTRICAL_VIOLET};
  stroke-width: 10;
  justify-content: center;
  vertical-align: auto;
  align-items: center;
  margin: auto;
`
