import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { WrapperWarning } from './WrapperWarning'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
}

export const WrapperCheckbox: React.FC<Props> = (/* { checked, onChange } */) => (
  <FlexDiv>
    <Text /* onClick={() => onChange(!checked)} */>
      {/* <Input type="checkbox" checked={checked} onChange={() => {}} /> */}
      {WrapperWarning()}
    </Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm cursor-pointer`}
`

// const Input = styled.input`
//   ${tw`cursor-pointer`}
// `

const FlexDiv = styled.div`
  ${tw`flex mb-2`}
`
