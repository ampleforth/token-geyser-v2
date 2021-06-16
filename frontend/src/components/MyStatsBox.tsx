import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveSubText, ResponsiveText } from '../styling/styles'
import { useSpring, animated } from 'react-spring'
import { useState } from 'react'

interface Props {
  name: string
  from?: number
  interpolate: (val: number) => string
  value: number
  units: string
  delim?: string
  classNames?: string
}

export const MyStatsBox: React.FC<Props> = ({ classNames, name, units, delim, value: targetValue, from, interpolate }) => {
  const [statsValue, setStatsValue] = useState<string>(interpolate(targetValue))

  // react-spring has a bug where floating point numbers are casted as integers on re-render (e.g. '1.0' gets shown as '1' on re-render).
  // this is a temporary work-around, see https://github.com/pmndrs/react-spring/issues/1564
  useSpring({
    val: targetValue,
    from: { val: from || 0 },
    onChange: ({ value }) => {
      setStatsValue(interpolate(value.val))
    },
  })

  return (
    <MyStatContainer>
      <MyStatName className={classNames}>{name}</MyStatName>
      <MyStatValueContainer>
        <MyStatValue>
          <animated.span>
            {statsValue}
          </animated.span>
          {delim}
          <MyStatUnits>{units}</MyStatUnits>
        </MyStatValue>
      </MyStatValueContainer>
    </MyStatContainer>
  )
}

const MyStatContainer = styled.div`
  ${tw`h-40px mt-4`}
  ${tw`sm:my-5 sm:col-span-1 sm:h-fit sm:h-72px`}
`

const MyStatName = styled.span`
  ${ResponsiveText}
  ${tw`mb-1 flex font-light`}
  ${tw`sm:mb-2 sm:mr-8 sm:block sm:ml-3`}
`

const MyStatValueContainer = styled.div`
  ${tw`flex`}
  ${tw`sm:rounded-full sm:bg-mediumGray sm:text-white sm:mt-2 sm:py-7 sm:items-center sm:justify-center sm:h-80px sm:w-80px`}
`

const MyStatValue = styled.span`
  width: 100%;
  ${tw`text-left sm:text-center`}
  ${ResponsiveText}
`

const MyStatUnits = styled.span`
  ${ResponsiveSubText}
`
