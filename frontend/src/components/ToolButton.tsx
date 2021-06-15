import styled from 'styled-components/macro'
import { ResponsiveSubText } from 'styling/styles'
import tw from 'twin.macro'

interface Props {
  displayText: string
  onClick: () => void
}

export const ToolButton: React.FC<Props> = ({ displayText, onClick, children }) => {
  return (
    <Button onClick={onClick}>
      {displayText} {children}
    </Button>
  )
}

const Button = styled.button`
  ${ResponsiveSubText}
  ${tw`p-0 ml-1 uppercase text-link`}
  ${tw`hover:underline`}
`
