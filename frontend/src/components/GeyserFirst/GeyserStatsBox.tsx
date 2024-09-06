import { useState } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useSpring, animated } from 'react-spring'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'

interface Props {
  name: string
  value: number
  units: string
  from?: number
  interpolate?: (val: number) => string
  containerClassName?: string
}

export const GeyserStatsBox: React.FC<Props> = ({
  name,
  value: targetValue,
  units,
  from,
  interpolate,
  containerClassName,
}) => {
  const [statsValue, setStatsValue] = useState<string>(interpolate ? interpolate(targetValue) : `${targetValue}`)

  useSpring({
    val: targetValue,
    from: { val: from || 0 },
    onChange: ({ value }) => {
      setStatsValue(interpolate ? interpolate(value.val) : `${value.val}`)
    },
  })

  return (
    <GeyserStatsBoxContainer className={containerClassName}>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        <GeyserStatsBoxValue>
          <animated.span>{statsValue}</animated.span> <GeyserStatsBoxUnits>{units}</GeyserStatsBoxUnits>
        </GeyserStatsBoxValue>
      </GeyserStatsBoxValueContainer>
    </GeyserStatsBoxContainer>
  )
}

const GeyserStatsBoxContainer = styled.div`
  ${tw`h-40px`}
  ${tw`sm:mr-5 sm:p-3 sm:h-72px`}
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
