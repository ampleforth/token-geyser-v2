import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { displayAddr } from '../utils/formatDisplayAddress'
import { HeaderWalletButton } from './HeaderWalletButton'

interface Props {}

export const Header: React.FC<Props> = () => {
  const { geysers } = useContext(GeyserContext)
  const { vaults } = useContext(VaultContext)

  return (
    <Container className="flex flex-wrap">
      <LeftContainer className="flex-grow-0">
        <LogoDiv className="float-left">Λ</LogoDiv>
        <div className="float-left">
          Geyser:
          <Select>
            {geysers.map((geyser) => (
              <option key={geyser.id} value={geyser.id}>
                {' '}
                {displayAddr(geyser.id)}{' '}
              </option>
            ))}
          </Select>
        </div>
        {vaults && vaults.length > 0 && (
          <div className="float-left">
            Vault:
            <Select>
              {vaults.map((vault) => (
                <option key={vault.id} value={vault.id}>
                  {' '}
                  {displayAddr(vault.id)}{' '}
                </option>
              ))}
            </Select>
          </div>
        )}
      </LeftContainer>
      <RightContainer className="flex-grow-0">
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const Select: React.FC = ({ children }) => {
  return <DropDownSelect className="rounded-2xl">{children}</DropDownSelect>
}

const Container = styled.div`
  height: fit-content;
`

const LogoDiv = styled.div`
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
  padding: 10px;
  padding-left: 20px;
  padding-right: 22px;
`

const DropDownSelect = styled.select`
  border: 1px solid silver;
  -webkit-appearance: none;
  padding: 1rem;
  margin-right: 10px;
`

const LeftContainer = styled.div`
  flex-basis: 66.666667%;
  max-width: 66.666667%;
`

const RightContainer = styled.div`
  flex-basis: 33.333333%;
  max-width: 33.333333%;
`
