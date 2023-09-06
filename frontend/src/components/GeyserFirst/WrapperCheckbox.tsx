import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
}

export const WrapperCheckbox: React.FC<Props> = ({ checked, onChange }) => (
  <FlexDiv>
    <Text onClick={() => onChange(!checked)}>
      <Input type="checkbox" checked={checked} onChange={() => {}} />
      &nbsp; Click here to wrap & stake in 1 transaction (saves gas)
    </Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm cursor-pointer`}
`

const Input = styled.input`
  ${tw`cursor-pointer`}
`

const FlexDiv = styled.div`
  ${tw`flex mb-2`}
`
