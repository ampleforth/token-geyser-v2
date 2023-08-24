import { useContext } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { activeNetworks, getConnectionConfig } from 'config/app'
import { Option, Select } from 'components/Select'
import Web3Context from 'context/Web3Context'

interface Props {}

export const HeaderNetworkSelect: React.FC<Props> = () => {
  const { selectNetwork, networkId } = useContext(Web3Context)

  const networkConfigs = activeNetworks.map((n) => getConnectionConfig(n))
  const networkOptions: Option[] = networkConfigs.map((n) => ({
    id: `${n.id}`,
    name: n.name,
  }))
  const selectedOption = networkOptions.findIndex((o) => o.id === `${networkId}`)
  const selected = selectedOption === -1 ? 0 : selectedOption

  return (
    <SelectContainer>
      <Select
        options={networkOptions}
        selected={selected}
        onChange={(t) => selectNetwork(parseInt(networkOptions[t].id, 10))}
      />
    </SelectContainer>
  )
}

const SelectContainer = styled.div`
  ${tw`w-6/12 pt-2 pr-2 text-black`}
`
