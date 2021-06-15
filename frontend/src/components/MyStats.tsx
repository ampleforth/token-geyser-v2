import styled from 'styled-components/macro'
import { ResponsiveText } from 'styling/styles'
import tw from 'twin.macro'
import { GeyserStatsBox } from './GeyserStatsBox'

interface MyStatProps {
  name: string
  value: string
  classNames?: string
}

const MyStat: React.FC<MyStatProps> = ({ classNames, name, value }) => {
  return (
    <MyStatContainer>
      <MyStatName className={classNames}>{name}</MyStatName>
      <MyStatValue>{value}</MyStatValue>
    </MyStatContainer>
  )
}

const MyStatContainer = styled.div`
  /* width: 78px; */
  ${tw`h-40px mt-4 font-roboto sm:my-5 sm:col-span-1 sm:h-fit sm:h-72px`}
`

const MyStatName = styled.span`
  ${tw`mb-1 flex font-light text-sm`}
  ${tw`sm:font-medium sm:mb-2 sm:mr-8 sm:block sm:ml-3 sm:text-base`}
`

const MyStatValue = styled.div`
  ${tw`flex text-sm`}
  ${tw`sm:text-base sm:rounded-full sm:bg-mediumGray sm:text-white sm:font-medium sm:mt-2 sm:py-7 sm:items-center sm:justify-center sm:h-80px sm:w-80px`}
`

export const MyStats = () => {
  return (
    <MyStatsContainer>
      <Header>My Stats</Header>
      <MyStatsWrapper>
        <MyStat classNames="sm:my-6" name="APY" value="19.44%" />
        <MyStat name="Reward Multiplier" value="1.0x" />
        <MyStat name="Current Rewards" value="0.00 AMPL" />
      </MyStatsWrapper>
      <div className="mt-4 sm:mt-0">
        <GeyserStatsBox name="External Rewards" value="0.00 BAL"></GeyserStatsBox>
      </div>
    </MyStatsContainer>
  )
}

const MyStatsContainer = styled.div`
  ${tw`px-5 my-5 pr-0 border-r-2 border-lightGray`}
`

const MyStatsWrapper = styled.div`
  ${tw`sm:grid sm:grid-cols-3 sm:h-180px`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${ResponsiveText}
  ${tw`uppercase flex font-medium sm:pl-3`}
`
