import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import Web3Context from 'context/Web3Context'
import { VaultContext } from 'context/VaultContext'
import { VaultsList } from './VaultsList'
import { GeysersList } from './GeysersList'

export const DropdownsContainer = ({ showGeysers, showVaults }) => {
  const { ready, validNetwork } = useContext(Web3Context)
  const { vaults } = useContext(VaultContext)
  if (validNetwork) {
    return (
      <Container>
        <Center>
          {showVaults && ready && vaults.length > 0 ? <VaultsList /> : <></>}
          {showGeysers ? <GeysersList /> : <></>}
        </Center>
      </Container>
    )
  }
  return <></>
}

const Center = styled.div`
  ${tw`flex-row`}
  ${tw`text-center m-auto my-4 flex flex-col`}
`

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-row w-full justify-center items-center`}
  ${tw`sm:w-sm`}
`
