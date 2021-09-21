import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
}

export const DisabledInput: React.FC<Props> = (props) => (
  <Container>
    <Input {...props} disabled  />
  </Container>
)

const Container = styled.div`
  ${tw`flex flex-row border border-gray h-fit mb-3 mt-1 rounded-md`}
`

const Input = styled.input`
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ${tw`w-full tracking-wider rounded-lg p-3 text-base`}
  ${tw`focus:outline-none`}
`
