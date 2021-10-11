import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  text:string
}

export const FormLabel: React.FC<Props> = ({text}) => (
  <FlexDiv>
    <Text><b>{text}:</b></Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm`}
`

const FlexDiv = styled.div`
  ${tw`flex`}
`
