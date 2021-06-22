import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveSubText } from 'styling/styles'

interface Props {
  displayText: string
  classNames?: string
  onClick: () => void
}

export const ToolButton: React.FC<Props> = ({ classNames, displayText, onClick, children }) => (
  <Button className={classNames} onClick={onClick}>
    {displayText} {children}
  </Button>
)

const Button = styled.button`
  ${ResponsiveSubText}
  ${tw`p-0 inline-flex uppercase text-link`}
  ${tw`hover:underline`}
`
