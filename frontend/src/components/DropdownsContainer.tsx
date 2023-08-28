import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeysersList } from './GeysersList'
import { VaultsList } from './VaultsList'

export const DropdownsContainer = () => (
  <Container>
    <Center>
      <VaultsList />
      <GeysersList />
    </Center>
  </Container>
)

const Center = styled.div`
  ${tw`header-wrap:flex-row`}
  ${tw`text-center m-auto flex flex-col`}
`

const Container = styled.div`
  ${tw`text-center m-auto flex flex-row w-full justify-center items-center`}
  ${tw`sm:w-sm`}
`
