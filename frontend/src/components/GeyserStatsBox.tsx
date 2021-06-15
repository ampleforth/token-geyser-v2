import styled from 'styled-components/macro'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'
import tw from 'twin.macro'

interface Props {
  name: string
  value: string
  units: string
}

export const GeyserStatsBox: React.FC<Props> = ({ name, value, units, children }) => {
  return (
    <GeyserStatsBoxContainer>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        <GeyserStatsBoxValue>
          {value}{' '}
          <GeyserStatsBoxUnits>
            {units} {children}
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
