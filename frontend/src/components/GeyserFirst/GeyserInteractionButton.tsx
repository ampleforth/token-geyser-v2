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
  ${tw`h-16 border-2 rounded-lg text-secondary uppercase font-semibold bg-lightBlue`};
  ${tw`disabled:bg-lightGray disabled:cursor-not-allowed disabled:border-none disabled:text-white`}
`
