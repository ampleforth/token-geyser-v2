import styled from 'styled-components/macro'
import { Overlay } from 'styling/styles'
import tw from 'twin.macro'
import { VaultBalanceView } from './VaultBalanceView'

export const VaultFirstContainer = () => {
  return (
    <Container>
      <Overlay>
        <VaultBalanceView />
      </Overlay>
    </Container>
  )
}

const Container = styled.div`
  ${tw`text-center m-auto flex flex-wrap w-full flex-col`}
  ${tw`sm:w-sm`}
`
