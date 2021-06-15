import styled from 'styled-components/macro'
import { ResponsiveText } from 'styling/styles'
import tw from 'twin.macro'

interface Props {
  name: string
  value: string
}

export const GeyserStatsBox: React.FC<Props> = ({ name, value, children }) => {
  return (
    <GeyserStatsBoxContainer>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        <GeyserStatsBoxValue>{value}</GeyserStatsBoxValue>
        {children}
      </GeyserStatsBoxValueContainer>
    </GeyserStatsBoxContainer>
  )
}

const GeyserStatsBoxContainer = styled.div`
  ${tw`h-40px sm:mr-5 sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm sm:p-3 sm:h-72px`}
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
