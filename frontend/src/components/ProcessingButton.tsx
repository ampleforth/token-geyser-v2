import styled from "styled-components/macro"
import tw from "twin.macro"
import { ModalButton } from "styling/styles"


export const ProcessingButton = () => (
  <DisabledButton disabled isLoading>
    Processing
  </DisabledButton>
)

const DisabledButton = styled(ModalButton)`
  ${tw`bg-lightGray cursor-not-allowed border-none text-white cursor-not-allowed`}
`
