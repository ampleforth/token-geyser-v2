import styled from 'styled-components/macro'
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
  width: 288px;
  height: 64px;
  ${tw`font-roboto bg-paleBlue border border-lightGray rounded-sm p-3`}
`

const GeyserStatsBoxLabel = styled.span`
  ${tw`flex`}
`

const GeyserStatsBoxValueContainer = styled.div`
  ${tw`flex flex-row`}
`

const GeyserStatsBoxValue = styled.span``
