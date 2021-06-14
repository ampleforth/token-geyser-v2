import { useContext } from 'react'
import styled, { css } from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserContext } from '../context/GeyserContext'
import { VaultContext } from '../context/VaultContext'
import { Dropdown } from './Dropdown'
import { HeaderWalletButton } from './HeaderWalletButton'
import { ToolButton } from './ToolButton'
import copy from 'assets/clipboard.svg'
import { ResponsiveText } from '../styling/styles'

export const Header = () => {
  const { geysers, selectGeyserByName, selectedGeyser, getGeyserName } = useContext(GeyserContext)
  const { vaults, selectVaultById, selectedVault } = useContext(VaultContext)

  const handleGeyserChange = (geyserName: string) => selectGeyserByName(geyserName)
  const handleVaultChange = (vaultId: string) => selectVaultById(vaultId)

  const handleCopyVaultID = () => navigator.clipboard.writeText(selectedVault!.id)

  return (
    <Container>
      <LeftContainer>
        <LogoSpan>Λ</LogoSpan>
        <HeaderLabel>Geyser</HeaderLabel>
      </LeftContainer>
      <MiddleContainer>
        <VaultsContainer>
          {vaults.length > 0 && (
            <>
              <Label>Vault</Label>
              <ToolButton classNames="my-auto mx-2" displayText="Copy" onClick={handleCopyVaultID}>
                <Img src={copy} alt="Copy" />
              </ToolButton>
              <Dropdown
                options={vaults.map((vault) => vault.id)}
                selectedOption={selectedVault ? selectedVault.id : vaults[0].id}
                onChange={handleVaultChange}
              />
            </>
          )}
        </VaultsContainer>
        <GeysersContainer>
          <>
            <Label>Geyser</Label>
            {geysers.length > 0 && (
              <Dropdown
                options={geysers.map((geyser) => getGeyserName(geyser.id))}
                selectedOption={getGeyserName(selectedGeyser ? selectedGeyser.id : geysers[0].id)}
                onChange={handleGeyserChange}
              />
            )}
          </>
        </GeysersContainer>
      </MiddleContainer>
      <RightContainer>
        <HeaderWalletButton />
      </RightContainer>
    </Container>
  )
}

// TODO: Add back in to geyser dropdown and remove mocks
// options={geysers.map((geyser) => geyserAddressToName.get(toChecksumAddress(geyser.id)) as string)}
// selectedOption={geyserAddressToName.get(toChecksumAddress(selectedGeyser ? selectedGeyser.id : geysers[0].id)) as string}

const Container = styled.div`
  ${tw`flex flex-wrap py-1 -mt-1 h-fit`}
  ${tw`xl:border-b xl:border-lightGray`}
`

const HeaderLabel = styled.span`
  ${tw`font-times italic text-2xl pt-5`}
`

const Label = styled.span`
  ${ResponsiveText}
  ${tw`tracking-widest font-light`}
  ${tw`xl:hidden`}
`

const LogoSpan = styled.span`
  font-family: 'Coromont Garamond';
  ${tw`ml-4 p-5 text-3xl`}
  ${tw`header-wrap:ml-20`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3`}
  ${tw`header-wrap:max-w-830px header-wrap:mx-auto header-wrap:order-2 header-wrap:w-1/3 xl:w-8/12`}
`
const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto`}
  ${tw`header-wrap:ml-0 header-wrap:order-3`}
`

const Img = styled.img`
  ${tw`w-auto mx-2 fill-current text-link`}
`

const DropdownContainer = css`
  ${tw`my-3`}
  ${tw`sm:mx-10 xl:mx-5 xl:flex flex-row`}
`

const VaultsContainer = styled.div`
  ${DropdownContainer}
  ${tw`xl:flex-row-reverse`}
`

const GeysersContainer = styled.div`
  ${DropdownContainer}
`
