// Collective place for universal styles
import styled from 'styled-components/macro'

export const Paragraph = styled.p`
  color: ${(props) => props.color};
  font-size: 1rem;
  font-weight: bold;
  margin: auto;
`

export const VaultFirstOverlay = styled.div`
  box-shadow: 0px -2px 25px -3px rgb(0 0 0 / 10%);
  border-radius: 10px;
  display: grid;
  grid-template-rows: 4fr 1fr;
  height: 70%;
`

export const VaultFirstTitle = styled.h1`
  font-size: 3rem;
`
