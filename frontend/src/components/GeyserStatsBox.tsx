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
  height: 72px;
  ${tw`mr-5 font-roboto bg-paleBlue border border-lightGray rounded-sm p-3`}
`

const GeyserStatsBoxLabel = styled.span`
  ${tw`mb-1 flex font-light`}
`

const GeyserStatsBoxValueContainer = styled.div`
  ${tw`flex flex-row`}
`

const GeyserStatsBoxValue = styled.span``
