import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useSpring } from 'react-spring'
import { ResponsiveSubText, ResponsiveText, AnimatedSpan } from '../styling/styles'

interface Props {
  name: string
  value: number
  units: string
  from?: number
  interpolate?: (val: number) => any
}

export const GeyserStatsBox: React.FC<Props> = ({ name, value, units, children, from, interpolate }) => {
  const styles = useSpring({ val: value, from: { val: from || 0 }})

  return (
    <GeyserStatsBoxContainer>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        <GeyserStatsBoxValue>
          <AnimatedSpan>
            {styles.val.to(val => interpolate ? interpolate(val) : val)}
          </AnimatedSpan>
          {' '}
          <GeyserStatsBoxUnits>
            {units}
            {children}
          </GeyserStatsBoxUnits>
        </GeyserStatsBoxValue>
      </GeyserStatsBoxValueContainer>
    </GeyserStatsBoxContainer>
  )
}

const GeyserStatsBoxContainer = styled.div`
  ${tw`h-40px`}
  ${tw`sm:mr-5 sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm sm:p-3 sm:h-72px`}
`

const GeyserStatsBoxLabel = styled.span`
  ${ResponsiveText}
  ${tw`mb-1 flex font-light`}
`

const GeyserStatsBoxValueContainer = styled.div`
  ${tw`flex flex-row`}
`

const GeyserStatsBoxValue = styled.span`
  ${ResponsiveText}
`

const GeyserStatsBoxUnits = styled.span`
  ${ResponsiveSubText}
`
