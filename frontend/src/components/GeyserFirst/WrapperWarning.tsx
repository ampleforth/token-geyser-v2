import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {}

export const WrapperWarning: React.FC<Props> = () => (
  <FlexDiv>
    <Text>
      <span className="tracking-tigher mt-2 flex font-bold ml-5 sm:ml-0 sm:text-3xl text-2xl text-surface">NOTE:</span>{' '}
      You must use the Wrapper button to make your asset compatible with the staking farms
    </Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm`}
`

const FlexDiv = styled.div`
  ${tw`flex`}
`
