import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  onClick: () => {}
  displayText: string
}

export const GeyserInteractionButton: React.FC<Props> = ({ onClick, displayText }) => {
  return <Button onClick={onClick}>{displayText}</Button>
}

const Button = styled.button`
  ${tw`h-16 border-2 rounded-lg bg-primary hover:border-primary hover:bg-secondary text-secondary hover:text-primary uppercase font-semibold`};
`
