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

  const handleGeyserChange = (geyserId: string) => selectGeyserById(geyserId)
  const handleVaultChange = (vaultId: string) => selectVaultById(vaultId)

  return (
    <Container>
      <WidthContainer>
        <FloatLeft>
          <LogoSpan>Λ</LogoSpan>
          <Label>Geyser</Label>
        </FloatLeft>
      </WidthContainer>
      <WidthContainer>
        {geysers.length > 0 && (
          <Dropdown
            options={geysers.map((geyser) => geyserAddressToName.get(toChecksumAddress(geyser.id)) as string)}
            selectedOption={
              geyserAddressToName.get(toChecksumAddress(selectedGeyser ? selectedGeyser.id : geysers[0].id)) as string
            }
            onChange={handleGeyserChange}
          />
        )}
        {vaults && vaults.length > 0 && (
          <Dropdown
            options={vaults.map((vault) => vault.id)}
            selectedOption={selectedVault ? selectedVault.id : vaults[0].id}
            onChange={handleVaultChange}
          />
        )}
      </WidthContainer>
      <WidthContainer>
        <HeaderWalletButton />
      </WidthContainer>
    </Container>
  )
}

const Container = styled.div`
  ${tw`flex flex-wrap py-1 -mt-1 sm:border-b sm:border-lightGray`}
  height: fit-content;
`

const Label = styled.span`
  ${tw`font-times italic text-2xl`}
`

const LogoSpan = styled.span`
  ${tw` ml-4 sm:ml-20 md:ml-32 p-5`}
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
`

const WidthContainer = styled.div`
  ${tw`w-1/3`}
`

const FloatLeft = styled.div`
  ${tw`float-left mt-2 justify-center self-center`}
`
