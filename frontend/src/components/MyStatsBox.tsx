import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'

interface Props {
  name: string
  value: string
  units: string
  delim?: string
  classNames?: string
}

export const MyStatsBox: React.FC<Props> = ({ classNames, name, units, delim, value }) => {
  return (
    <MyStatContainer>
      <MyStatName className={classNames}>{name}</MyStatName>
      <MyStatValueContainer>
        <MyStatValue>
          {value}
          {delim}
          <MyStatUnits>{units}</MyStatUnits>
        </MyStatValue>
      </MyStatValueContainer>
    </MyStatContainer>
  )
}

const MyStatContainer = styled.div`
  ${tw`h-40px mt-4 sm:my-5 sm:col-span-1 sm:h-fit sm:h-72px`}
`

const MyStatName = styled.span`
  ${ResponsiveText}
  ${tw`mb-1 flex font-light sm:mb-2 sm:mr-8 sm:block sm:ml-3`}
`

const MyStatValueContainer = styled.div`
  ${tw`flex sm:rounded-full sm:bg-mediumGray sm:text-white sm:mt-2 sm:py-7 sm:items-center sm:justify-center sm:h-80px sm:w-80px`}
`

const MyStatValue = styled.span`
  ${ResponsiveText}
`

const MyStatUnits = styled.span`
  ${ResponsiveSubText}
`
