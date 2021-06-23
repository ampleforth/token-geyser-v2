import styled from 'styled-components/macro'
import tw from 'twin.macro'
import copy from 'assets/clipboard.svg'
import { Ellipsis, ResponsiveText } from 'styling/styles'
import { useContext } from 'react'
import { VaultContext } from 'context/VaultContext'
import { ToolButton } from './ToolButton'
import { Dropdown } from './Dropdown'

export const VaultsList = () => {
  const { vaults, selectVaultById, selectedVault } = useContext(VaultContext)

  const handleCopyToClipboard = () => navigator.clipboard.writeText(selectedVault ? selectedVault.id : vaults[0].id)
  const handleVaultChange = (vaultId: string) => selectVaultById(vaultId)

  return (
    <>
      {vaults.length > 0 && (
        <VaultsListContainer>
          <Heading>
            <Label>Vault ID</Label>
            <ToolButton classNames="my-auto mx-4" displayText="Copy" onClick={handleCopyToClipboard}>
              <Img src={copy} alt="Copy" />
            </ToolButton>
          </Heading>
          {vaults.length > 1 ? (
            <Dropdown
              options={vaults.map((vault) => vault.id)}
              selectedOption={selectedVault ? selectedVault.id : vaults[0].id}
              onChange={handleVaultChange}
            />
          ) : (
            <SelectedOption>{selectedVault ? selectedVault.id : vaults[0].id}</SelectedOption>
          )}
        </VaultsListContainer>
      )}
    </>
  )
}

const VaultsListContainer = styled.div`
  ${tw`mx-5 my-3`}
  ${tw`sm:mx-10 xl:mx-5`}
`

const Heading = styled.div`
  ${tw`flex flex-row`}
`

const Label = styled.span`
  ${ResponsiveText}
  ${tw`tracking-wider`}
`

const Img = styled.img`
  ${tw`w-16px h-16px`}
  ${tw`mx-2 fill-current text-link`}
`

const SelectedOption = styled.span`
  ${ResponsiveText}
  ${Ellipsis}
  ${tw`font-bold tracking-wide block my-2 w-336px`}
`
