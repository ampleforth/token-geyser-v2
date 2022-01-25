import React from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { animated } from 'react-spring'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'

interface Stat {
  value: number
  units: string
}

interface Props {
  name: string
  stats: Stat[]
  from?: number
  interpolate?: (val: number) => string
  containerClassName?: string
}

export const GeyserMultiStatsBox: React.FC<Props> = ({ name, stats, interpolate, containerClassName }) => {

  const displayVal = (v:number):string => interpolate ? interpolate(v) : `${v}`
  const statsContent = stats.map((s, index) => (
    <React.Fragment key={s.units}>
       <GeyserStatsBoxValue>
        <animated.span>
          {displayVal(s.value)}
        </animated.span>
        {' '}
        <GeyserStatsBoxUnits>
          {s.units}
        </GeyserStatsBoxUnits>
      </GeyserStatsBoxValue>
      {stats.length > 1 && index !== stats.length-1 ? '\u00a0+\u00a0' : ''}
    </React.Fragment>
  ))
  
  return (
    <GeyserStatsBoxContainer className={containerClassName}>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        {statsContent}
      </GeyserStatsBoxValueContainer>
    </GeyserStatsBoxContainer>
  )
}

const GeyserStatsBoxContainer = styled.div`
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
