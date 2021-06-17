import styled from 'styled-components/macro'
import { VaultFirstOverlay } from 'styling/styles'
import tw from 'twin.macro'
import { VaultBalanceView } from './VaultBalanceView'

export const VaultFirstContainer = () => {
  return (
    <Container>
      <VaultFirstOverlay>
        <VaultBalanceView />
      </VaultFirstOverlay>
    </Container>
  )
}

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-wrap w-full flex-col`}
  ${tw`sm:w-sm`}
`
