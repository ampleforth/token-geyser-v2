import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {}

export const StakingWarning: React.FC<Props> = () => (
  <FlexDiv>
    <Text>
      <span className="tracking-tigher mt-2 flex font-bold sm:text-3xl text-2xl text-surface mb-2">NOTE:</span> You must
      use the Wrapper button to make your asset compatible with the staking farms.
    </Text>
  </FlexDiv>
)

export const WrapperWarning = () => (
  <FlexDiv>
    <Text>
      <div className="tracking-tigher mt-2 flex font-bold sm:text-3xl text-2xl text-surface mb-2">NOTE:</div>
      Depositing sTokens into the Farms will decrease your collateral health factor. If you are borrowing on Seamless,
      be careful when staking sTokens, in order to avoid unnecessary liquidations.
      <br />
      <br />
      For example, only stake 50% of your max sToken balance (the transaction will fail if you choose MAX). Read more
      about collateral health factor{' '}
      <Link href="https://docs.aave.com/faq/borrowing" target="_blank" rel="noreferrer">
        here
      </Link>
      .
      <br />
      <br />
      After wrapping is completed, go to the Stake button to finish staking.
    </Text>
  </FlexDiv>
)

const Text = styled.span`
  ${tw`text-xs sm:text-sm text-left`}
`
const FlexDiv = styled.div`
  ${tw`flex mb-2 cursor-default`}
`
const Link = styled.a`
  ${tw`text-surface underline`}
`
