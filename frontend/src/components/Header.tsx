import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { toChecksumAddress } from 'web3-utils'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { displayAddr } from '../utils/formatDisplayAddress'
import { Dropdown } from './Dropdown'
import { HeaderWalletButton } from './HeaderWalletButton'

export const Header = () => {
  const { geysers, selectGeyserById, selectedGeyser, geyserAddressToName } = useContext(GeyserContext)
  const { vaults, selectVaultById, selectedVault } = useContext(VaultContext)

  const handleSelectGeyser = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectGeyserById(e.currentTarget.value)
  }

  const handleSelectVault = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectVaultById(e.currentTarget.value)
  }

  const handleGeyserChange = (geyserId: string) => selectGeyserById(geyserId)
  const handleVaultChange = (vaultId: string) => selectVaultById(vaultId)

  return (
    <Container>
      <LeftContainer className="flex-grow-0">
        <FloatLeft>
          <LogoSpan>Λ</LogoSpan>
          <Label>Geyser</Label>
        </FloatLeft>
      </LeftContainer>
      <MidContainer>
        {/* <Select onChange={handleSelectGeyser}>
          {geysers.map((geyser) => (
            <option key={geyser.id} value={geyser.id}>
              {' '}
              {geyserAddressToName.get(toChecksumAddress(geyser.id))}{' '}
            </option>
          ))}
            </Select> */}
        {geysers.length > 0 && (
          <Dropdown
            options={geysers.map((geyser) => geyser.id)}
            selectedOption={selectedGeyser ? selectedGeyser.id : geysers[0].id}
            onChange={handleGeyserChange}
          />
        )}
        {vaults && vaults.length > 0 && (
          <Dropdown
            options={vaults.map((vault) => vault.id)}
            selectedOption={vaults[0].id}
            onChange={handleVaultChange}
          />
        )}
      </MidContainer>
      <RightContainer className="flex-grow-0">
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select: React.FC<SelectProps> = (props) => {
  const { children } = props
  return (
    <DropDownSelect {...props} className="rounded-2xl">
      {children}
    </DropDownSelect>
  )
}

const Container = styled.div`
  ${tw`flex flex-wrap py-1 -mt-1 border-b border-lightGray`}
  height: fit-content;
`

const Label = styled.span`
  ${tw`font-times italic text-2xl`}
`

const LogoSpan = styled.span`
  ${tw`ml-40`}
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
  flex-basis: 33.333333%;
  max-width: 33.333333%;
`

const MidContainer = styled.div`
  flex-basis: 33.333333%;
  max-width: 33.333333%;
`

const RightContainer = styled.div`
  flex-basis: 33.333333%;
  max-width: 33.333333%;
`

const FloatLeft = styled.div`
  ${tw`float-left mt-2 justify-center self-center`}
`
