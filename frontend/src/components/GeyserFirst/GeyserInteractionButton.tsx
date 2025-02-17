import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  onClick: () => void
  displayText: string
  disabled?: boolean
}

export const GeyserInteractionButton: React.FC<Props> = ({ onClick, displayText, disabled }) => (
  <Button disabled={disabled} onClick={onClick}>
    {displayText}
  </Button>
)

const Button = styled.button`
  ${tw`h-16 border-2 rounded-lg bg-secondary text-white uppercase font-semibold`};
  ${tw`hover:border-white hover:bg-secondaryDark hover:text-white`}
  ${tw`disabled:bg-lightGray disabled:cursor-not-allowed disabled:border-none disabled:text-white`}
`
