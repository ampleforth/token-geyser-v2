import styled from 'styled-components/macro'
import { CardLabel, Overlay } from 'styling/styles'
import tw from 'twin.macro'
import { VaultBalanceView } from './VaultBalanceView'

export const VaultFirstContainer = () => (
  <Container>
    <Overlay className="bg-white text-black">
      <Title>Manage Balances</Title>
      <VaultBalanceView />
    </Overlay>
  </Container>
)

const Title = styled(CardLabel)`
  ${tw`text-xl p-5 text-left font-normal text-black`}
`

const Container = styled.div`
  ${tw`text-center m-auto flex flex-wrap w-full flex-col rounded-md`}
  ${tw`sm:w-sm`}
`
