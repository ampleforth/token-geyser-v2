import React from 'react';
import styled from 'styled-components/macro';
import UserAddress from './UserAddress';

interface HeaderContainerProps {}

export const HeaderContainer: React.FC<HeaderContainerProps> = () => {
  return (
    <Container>
      <LogoDiv>Λ</LogoDiv>
      <UserAddress />
    </Container>
  );
}

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
