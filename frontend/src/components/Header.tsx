import React from 'react'
import styled from 'styled-components/macro'
import { HeaderWalletButton } from './HeaderWalletButton'

interface Props {}

export const Header: React.FC<Props> = () => (
  <Container>
    <LogoDiv>Λ</LogoDiv>
    <HeaderWalletButton />
  </Container>
)

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 50px;
`

const LogoDiv = styled.div`
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
  padding: 10px;
  padding-left: 20px;
  padding-right: 22px;
`
