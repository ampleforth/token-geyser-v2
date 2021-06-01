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
  width: 100%;
  box-sizing: border-box;
  padding: 12px 10px;
  font-size: bold;
  text-indent: 10px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  border-radius: 5px;
  border: 1px solid ${NamedColors.ALTO};
  font-size: 1.2rem;
  height: 60px;
  margin-bottom: 10px;
`

export const GeyserInteractionButton = styled.button`
  cursor: pointer;
  width: 100%;
  height: 60px;
  border-radius: 8px;
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

export const GeyserFirstOverlay = styled.div`
  box-shadow: 0px -2px 25px -3px rgb(0 0 0 / 10%);
  border-radius: 10px;
`

export const LogoDiv = styled.div`
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
  padding: 10px;
  padding-left: 20px;
  padding-right: 22px;
`
