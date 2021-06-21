import styled from "styled-components/macro"
import tw from "twin.macro"
import { ModalButtonStyle } from "styling/styles"
import { LoadingButton } from "./LoadingButton"


export const ProcessingButton = () => (
  <DisabledButton disabled isLoading>
    Processing
  </DisabledButton>
)

const DisabledButton = styled(LoadingButton)`
  ${ModalButtonStyle}
  ${tw`bg-lightGray cursor-not-allowed border-none text-white cursor-not-allowed`}
`
