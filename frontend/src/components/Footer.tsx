import styled from 'styled-components/macro'
import tw from 'twin.macro'

export const Footer = () => (
  <Container>
    <LeftContainer />
    <MiddleContainer>
      <LinkSpan>
        <a
          className="text-link"
          href="https://medium.com/ampleforth/quick-start-amplgeyser-guide-universal-vault-nft-c2705461de15"
        >
          Getting started
        </a>
        {' | '}
        <a
          className="text-link"
          href="https://medium.com/ampleforth/ampl-geyser-v2-launches-with-universal-vault-nft-7b7a459460da"
        >
          Mining Rewards
        </a>
        {' | '}
        <a className="text-link" href="https://ampleforth.org/geyser">
          GeyserV1
        </a>
      </LinkSpan>
    </MiddleContainer>
    <RightContainer />
  </Container>
)

const Container = styled.div`
  ${tw`shadow-sm flex flex-wrap py-1 -mt-1 h-fit`}
`

const LeftContainer = styled.div`
  ${tw`flex w-auto`}
  ${tw`w-2/12`}
`

const MiddleContainer = styled.div`
  ${tw`flex flex-col xl:flex-row items-center justify-center w-full order-3 py-6`}
  ${tw`py-0 max-w-830px mx-auto order-2 w-1/3 xl:w-7/12`}
`

const RightContainer = styled.div`
  ${tw`ml-auto order-2 w-auto`}
  ${tw`ml-0 order-3 w-2/12`}
`

// NOTE: this is hot fix!
// Remove !important
const LinkSpan = styled.span`
  ${tw`ml-2 p-3`}
  ${tw`ml-20`}
  margin:0px !important;
`
