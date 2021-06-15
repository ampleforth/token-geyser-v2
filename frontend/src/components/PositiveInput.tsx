import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  precision?: number
}

export const PositiveInput: React.FC<Props> = (props) => {
  const { onChange, precision } = props

  const respectsPrecision = (value: string) => {
    if (precision) {
      const parts = value.split('.')
      return parts.length > 0 ? parts[1].length <= precision : true
    }
    return true
  }

  const positiveOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pattern = new RegExp(`(^\\d+$|^\\d+\\.\\d+$|^\\d+\\.$|^$)`)
    const { value } = e.currentTarget
    if (onChange && pattern.test(value) && respectsPrecision(value)) {
      onChange(e)
    }
  }

  return <Input {...props} onChange={positiveOnChange} />
}

const Input = styled.input`
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ${tw`w-full p-3 my-3 border-2 border border-gray focus:border-primary font-semibold tracking-wider text-base rounded-md`}
`
