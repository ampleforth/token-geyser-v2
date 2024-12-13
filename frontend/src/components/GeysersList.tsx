import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ResponsiveText } from 'styling/styles'
import { useContext } from 'react'
import { GeyserContext } from 'context/GeyserContext'
import { VaultContext } from 'context/VaultContext'
import { useNavigate } from 'react-router-dom'
import { Dropdown } from './Dropdown'

export const GeysersList = () => {
  const navigate = useNavigate()
  const {
    geysers,
    getGeyserRefByName,
    selectedGeyserInfo: { geyser: selectedGeyser },
    getGeyserName,
  } = useContext(GeyserContext)
  const { selectedVault } = useContext(VaultContext)

  const handleGeyserChange = async (geyserName: string) => {
    navigate(`/geysers/${getGeyserRefByName(geyserName)}`)
  }

  const optgroups = (() => {
    const stakedGeysers = selectedVault ? selectedVault.locks.map((l) => l.geyser) : []
    const geysersToShow = geysers.filter((g) => g.active || stakedGeysers.find((s) => s.id === g.id))
    const activeGeysers = geysersToShow.filter((g) => g.active === true).map(({ id }) => getGeyserName(id))
    const inactiveGeysers = geysersToShow.filter((g) => !(g.active === true)).map(({ id }) => getGeyserName(id))

    const options = [
      {
        group: 'Active Geysers',
        options: activeGeysers,
      },
    ]

    if (inactiveGeysers.length > 0) {
      options.push({
        group: 'Inactive Geysers',
        options: inactiveGeysers,
      })
    }

    return options
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
