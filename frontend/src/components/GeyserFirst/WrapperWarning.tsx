import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {}

export const WrapperWarning: React.FC<Props> = () => (
  <FlexDiv>
    <Text>
      <b>NOTE:</b> Liquidity token needs to be wrapped before staking
    </Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm`}
`

const FlexDiv = styled.div`
  ${tw`flex`}
`
