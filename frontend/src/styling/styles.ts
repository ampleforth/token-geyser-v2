// Collective place for universal styles
import styled from 'styled-components/macro'
import { NamedColors } from './colors'

// TODO: Set up theming, media breakpoints styling, typography

export const Input = styled.input`
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  width: 75%;
  box-sizing: border-box;
  padding: 12px 10px;
  font-size: bold;
  text-indent: 10px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  border-radius: 5px;
  border: 1px solid ${NamedColors.ALTO};
  font-size: 1.2rem;
  height: 60px;
  margin: 16px;
`

export const ManageVaultButton = styled.button`
  cursor: pointer;
  width: 75%;
  height: 60px;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid ${NamedColors.WHITE};
  background-color: ${NamedColors.ELECTRICAL_VIOLET};
  :hover {
    background-color: ${NamedColors.RADICAL_RED};
  }
`

export const VaultInfoMessage = styled.h1`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
`

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

export const BigVaultFirstOverlay = styled.div`
  box-shadow: 0px -2px 25px -3px rgb(0 0 0 / 10%);
  border-radius: 10px;
  display: grid;
  grid-template-rows: 0.5fr 2fr;
  height: 90%;
`

export const VaultFirstTitle = styled.h1`
  font-size: 3rem;
`

export const LogoDiv = styled.div`
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
  padding: 10px;
  padding-left: 20px;
  padding-right: 22px;
`
