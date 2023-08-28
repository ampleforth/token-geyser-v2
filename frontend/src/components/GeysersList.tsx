import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveText } from 'styling/styles'
import { useContext } from 'react'
import { GeyserContext } from 'context/GeyserContext'
import { Dropdown } from './Dropdown'

export const GeysersList = () => {
  const {
    geysers,
    selectGeyserByName,
    selectedGeyserInfo: { geyser: selectedGeyser },
    getGeyserName,
  } = useContext(GeyserContext)
  const handleGeyserChange = (geyserName: string) => selectGeyserByName(geyserName)

  const optgroups = (() => {
    const activeGeysers = geysers.filter((g) => g.active === true).map(({ id }) => getGeyserName(id))
    const inactiveGeysers = geysers.filter((g) => !(g.active === true)).map(({ id }) => getGeyserName(id))
    return [
      {
        group: 'Active Geysers',
        options: activeGeysers,
      },
      {
        group: 'Inactive Geysers',
        options: inactiveGeysers,
      },
    ]
  })()

  return (
    <>
      {geysers.length > 0 && (
        <GeysersListContainer>
          <Heading>
            <Label>Geyser</Label>
          </Heading>
          <Dropdown
            optgroups={optgroups}
            selectedOption={getGeyserName(selectedGeyser ? selectedGeyser.id : geysers[0].id)}
            onChange={handleGeyserChange}
          />
        </GeysersListContainer>
      )}
    </>
  )
}

const GeysersListContainer = styled.div`
  ${tw`mx-5 sm:mx-10 xl:mx-5`}
`

const Heading = styled.div`
  ${tw`flex flex-row`}
`

const Label = styled.span`
  ${ResponsiveText}
  ${tw`tracking-wider`}
`
