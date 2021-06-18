import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveText } from 'styling/styles'
import { useContext } from 'react'
import { GeyserContext } from 'context/GeyserContext'
import { Dropdown } from './Dropdown'

export const GeysersList = () => {
  const { geysers, selectGeyserByName, selectedGeyser, getGeyserName } = useContext(GeyserContext)
  const handleGeyserChange = (geyserName: string) => selectGeyserByName(geyserName)

  return (
    <>
      {geysers.length > 0 && (
        <GeysersListContainer>
          <Heading>
            <Label>Geyser</Label>
          </Heading>
          <Dropdown
            options={geysers.map((geyser) => getGeyserName(geyser.id))}
            selectedOption={getGeyserName(selectedGeyser ? selectedGeyser.id : geysers[0].id)}
            onChange={handleGeyserChange}
          />
        </GeysersListContainer>
      )}
    </>
  )
}

const GeysersListContainer = styled.div`
  ${tw`my-3`}
  ${tw`mx-5 sm:mx-10 xl:mx-5`}
`

const Heading = styled.div`
  ${tw`flex flex-row`}
`

const Label = styled.span`
  ${ResponsiveText}
  ${tw`tracking-wider`}
`
