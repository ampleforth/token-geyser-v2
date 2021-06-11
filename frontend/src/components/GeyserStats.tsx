import styled from 'styled-components/macro'
import tw from 'twin.macro'

export const GeyserStats = () => {
  return (
    <GeyserStatsContainer>
      <Header>Geyser Stats</Header>
    </GeyserStatsContainer>
  )
}

const GeyserStatsContainer = styled.div`
  ${tw`w-full font-roboto m-5`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${tw`uppercase flex font-medium mx-5`}
`
