import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { Switch } from '@headlessui/react'
import { ResponsiveHeader } from 'styling/styles'

interface Props {
  enabled: boolean
  toggle: () => void
  options: [string, string]
}

export const HeaderToggle: React.FC<Props> = ({ enabled, toggle, options }) => (
  <Switch.Group>
    <div className="flex items-center text-center">
      <SwitchLabel className="mr-4">{options[0]}</SwitchLabel>
      <Switchy className="bg-cream" checked={enabled} onChange={toggle}>
        <span
          className={`${
            enabled ? 'translate-x-3' : 'translate-x-0'
          } inline-block w-5 h-5 transform bg-lightBlue border border-lightBlack rounded-full transition-transform`}
        />
      </Switchy>
      <SwitchLabel className="ml-4">{options[1]}</SwitchLabel>
    </div>
  </Switch.Group>
)

const SwitchLabel = styled(Switch.Label)`
  ${ResponsiveHeader}
  ${tw`font-normal tracking-wider`}
`

const Switchy = styled(Switch)`
  ${tw`relative inline-flex items-center h-3 rounded-full w-8 transition-colors`}
  ${tw`focus:outline-none`}
`
