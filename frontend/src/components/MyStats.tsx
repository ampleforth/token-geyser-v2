import React from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { GeyserStatsBox } from './GeyserStatsBox'

interface MyStatProps {
  name: string
  value: string // including units
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
  max-width: 68px;
  ${tw`font-roboto my-5`}
`

const MyStatName = styled.h5`
  ${tw`font-medium mb-2`}
`

const MyStatValue = styled.div`
  width: 80px;
  height: 80px;
  ${tw`rounded-full bg-mediumGray text-white font-medium mt-2 py-7 items-center justify-center`}
`

export const MyStats = () => {
  return (
    <MyStatsContainer>
      <Header>My Stats</Header>
      <MyStatsWrapper>
        <MyStat classNames="my-6" name="APY" value="Test" />
        <MyStat name="Reward Multiplier" value="Test" />
        <MyStat name="Current Rewards" value="Test" />
      </MyStatsWrapper>
      <GeyserStatsBox name="External Rewards" value="0.00 BAL"></GeyserStatsBox>
    </MyStatsContainer>
  )
}

const MyStatsContainer = styled.div`
  ${tw`font-roboto px-5 my-5 pr-0 border-r-2 border-lightGray`}
`

const MyStatsWrapper = styled.div`
  ${tw`grid grid-cols-3`}
`

const Header = styled.h3`
  color: #ff1d1d;
  ${tw`uppercase flex font-medium mx-5`}
`
