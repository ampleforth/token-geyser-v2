import React from 'react'
import { useSpring, animated } from 'react-spring'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { safeNumeral } from 'utils/numeral'
import { LoaderDark } from 'styling/styles'

const WelcomeHero = ({ tvl, totalRewards }) => {
  const lockedSpring = useSpring({
    val: tvl,
    from: { val: 0 },
    config: { duration: 1500 },
  })

  const rewardsSpring = useSpring({
    val: totalRewards,
    from: { val: 0 },
    config: { duration: 1500 },
  })

  return (
    <CalloutBox>
      <List>
        <ListItem>
          Deposit&nbsp;<RedHighlight>$liquidity-tokens</RedHighlight>
        </ListItem>
        <ListItem>
          Receive a continuous drip of&nbsp;<GreenHighlight>$reward-tokens</GreenHighlight>
        </ListItem>
      </List>
      <Hr />
      {tvl > 0 || totalRewards > 0 ? (
        <StatsBox>
          <Stat>
            <StatValue>
              <animated.span>{lockedSpring.val.to((val) => `${safeNumeral(val, '$0,0')}`)}</animated.span>
            </StatValue>
            <Label>Total Deposits</Label>
          </Stat>
          <Stat>
            <StatValue>
              <animated.span>{rewardsSpring.val.to((val) => `${safeNumeral(val, '$0,0')}`)}</animated.span>
            </StatValue>
            <Label>Total Rewards</Label>
          </Stat>
        </StatsBox>
      ) : (
        <LoaderContainer>
          <LoaderDark />
        </LoaderContainer>
      )}
    </CalloutBox>
  )
}

const CalloutBox = styled.div`
  ${tw`justify-around flex flex-col`}
  ${tw`bg-black text-white p-8 rounded-lg text-md font-mono bg-opacity-90`}
  ${tw`mb-10`}
`

const StatsBox = styled.div`
  ${tw`flex justify-around mt-8`}
`

const Stat = styled.div`
  ${tw`text-center w-1/2`}
`

const StatValue = styled.div`
  ${tw`text-4xl font-bold font-mono`}
`

const Label = styled.div`
  ${tw`mt-2 text-sm text-gray font-bold`}
`

const List = styled.ul`
  ${tw`p-0 mx-10 mb-5`}
`

const ListItem = styled.li`
  ${tw`flex mb-2`}
  list-style-type: disc;
  display: list-item;
`

const RedHighlight = styled.span`
  ${tw`text-primary font-bold`}
`

const GreenHighlight = styled.span`
  ${tw`text-greenLight font-bold`}
`

const Hr = styled.hr`
  ${tw`border-t border-white w-full`}
`
const LoaderContainer = styled.div`
  ${tw`flex items-center justify-center w-full m-5 mt-11 mb-10`}
`

export default WelcomeHero
