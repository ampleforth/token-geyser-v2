import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { toChecksumAddress } from 'web3-utils'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { Dropdown } from './Dropdown'
import { HeaderWalletButton } from './HeaderWalletButton'

export const Header = () => {
  const { geysers, selectGeyserById, selectedGeyser, geyserAddressToName } = useContext(GeyserContext)
  const { vaults, selectVaultById, selectedVault } = useContext(VaultContext)

  const handleGeyserChange = (geyserId: string) => selectGeyserById(geyserId)
  const handleVaultChange = (vaultId: string) => selectVaultById(vaultId)

  return (
    <Container>
      <LeftContainer>
        <LogoSpan>Λ</LogoSpan>
        <Label>Geyser</Label>
      </LeftContainer>
      <MiddleContainer>
        {geysers.length > 0 && (
          <Dropdown
            options={geysers.map((geyser) => geyserAddressToName.get(toChecksumAddress(geyser.id)) as string)}
            selectedOption={
              geyserAddressToName.get(toChecksumAddress(selectedGeyser ? selectedGeyser.id : geysers[0].id)) as string
            }
            onChange={handleGeyserChange}
          />
        )}
        {vaults.length > 0 && (
          <Dropdown
            options={vaults.map((vault) => vault.id)}
            selectedOption={selectedVault ? selectedVault.id : vaults[0].id}
            onChange={handleVaultChange}
          />
        )}
      </MiddleContainer>
      <RightContainer>
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

const Container = styled.div`
  ${tw`flex flex-wrap py-1 -mt-1 h-fit`}
  ${tw`sm:border-b sm:border-lightGray`}
`

const Label = styled.span`
  ${tw`font-times italic text-2xl`}
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw` ml-4 p-5 text-3xl`}
  ${tw`sm:ml-20 md:ml-32`}
`

const LeftContainer = styled.div`
  ${tw`flex items-center w-auto header-wrap:w-1/4`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-wrap items-center justify-center w-full order-3 header-wrap:w-1/2 header-wrap:order-2`}
`
const RightContainer = styled.div`
  ${tw`ml-auto order-2 header-wrap:order-3 w-auto header-wrap:w-1/4`}
`
