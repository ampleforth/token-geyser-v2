import styled from 'styled-components/macro'
import tw from 'twin.macro'

export const WelcomeMessage = () => (
  <Container>
    <Title>
      Stake <Highlight>Liquidity</Highlight>
    </Title>
    <Subtitle>
      <Link
        href="https://blog.ampleforth.org/ampl-geyser-v2-launches-with-universal-vault-nft-7b7a459460da"
        target="_blank"
      >
        Geysers
      </Link>{' '}
      are smart faucets that incentivize&nbsp;
      <Link href="https://ampleforth.org/" target="_blank">
        AMPL
      </Link>{' '}
      and{' '}
      <Link href="https://spot.cash" target="_blank">
        SPOT
      </Link>{' '}
      on-chain liquidity.
      <br />
      The more liquidity you provide and for longer, the more rewards you receive.
    </Subtitle>
  </Container>
)

const Container = styled.div`
  ${tw`w-full my-8 px-4`}
`

const Title = styled.h1`
  ${tw`text-2xl font-bold mb-4 font-roboto`}
`

const Highlight = styled.span`
  ${tw`text-black font-regular`}
`

const Subtitle = styled.p`
  ${tw`text-base text-black mb-6 leading-relaxed`}
`

const Link = styled.a`
  ${tw`cursor-pointer text-link hover:underline`}
`
