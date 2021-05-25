import React from 'react'
import styled from 'styled-components/macro'

// TODO: Use spinner from tailwind
export const LoadingSpinner = () => {
  return <Spinner>Loading...</Spinner>
}

const Spinner = styled.div`
  display: flex;
  flex: row;
  justify-content: center;
  vertical-align: auto;
  align-items: center;
  margin: auto;
`
