import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveSubText, ResponsiveText, AnimatedSpan } from '../styling/styles'
import { useSpring } from 'react-spring'

interface Props {
  name: string
  from?: number
  interpolate?: (val: number) => any
  value: number
  units: string
  delim?: string
  classNames?: string
}

export const MyStatsBox: React.FC<Props> = ({ classNames, name, units, delim, value, from, interpolate }) => {
  const styles = useSpring({ val: value, from: { val: from || 0 } })

  return (
    <MyStatContainer>
      <MyStatName className={classNames}>{name}</MyStatName>
      <MyStatValueContainer>
        <MyStatValue>
          <AnimatedSpan>
            {styles.val.to(val => interpolate ? interpolate(val) : val)}
          </AnimatedSpan>
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
  ${ResponsiveText}
`

const MyStatUnits = styled.span`
  ${ResponsiveSubText}
`
