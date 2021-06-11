import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  onClick: () => {}
  displayText: string
  disabled?: boolean
}

export const GeyserInteractionButton: React.FC<Props> = ({ onClick, displayText, disabled }) => {
  return (
    <Button disabled={disabled} onClick={onClick}>
      {displayText}
    </Button>
  )
}

const Button = styled.button`
  ${tw`h-16 border-2 rounded-lg bg-primary hover:border-primary hover:bg-secondary text-secondary hover:text-primary uppercase font-semibold`};
`
