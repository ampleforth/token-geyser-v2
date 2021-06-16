import styled from 'styled-components/macro'
import { ResponsiveSubText } from '../styling/styles'
import tw from 'twin.macro'

interface Props {
  displayText: string
  classNames?: string
  onClick: () => void
}

export const ToolButton: React.FC<Props> = ({ classNames, displayText, onClick, children }) => {
  return (
    <Button className={classNames} onClick={onClick}>
      {displayText} {children}
    </Button>
  )
}

const Button = styled.button`
  ${ResponsiveSubText}
  ${tw`p-0 inline-flex uppercase text-link`}
  ${tw`hover:underline`}
`
