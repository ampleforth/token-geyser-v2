import React from 'react'
import { Switch } from '@headlessui/react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  enabled: boolean
  options: [string, string]
  toggle: () => void
}

export const ToggleView: React.FC<Props> = ({ enabled, toggle, options }) => (
  <Switch className="w-full" checked={!enabled} onChange={toggle}>
    <SwitchContainer className='h-14'>
      <SwitchOptionOne className={!enabled ? 'text-gray' : 'text-darkGray'}>{options[0]}</SwitchOptionOne>
      <span
        className={`block h-full w-1/2 rounded transition duration-300 ease-in-out transform ${
          !enabled ? 'bg-white translate-x-full' : 'bg-white'
        }`}
      />
      <SwitchOptionTwo className={!enabled ? 'text-darkGray' : 'text-gray'}>{options[1]}</SwitchOptionTwo>
    </SwitchContainer>
  </Switch>
)

const SwitchContainer = styled.span`
  ${tw`bg-darkGray relative rounded m-auto flex border border-darkGray`}
`

const SwitchOptionOne = styled.span`
  ${tw`font-bold uppercase absolute z-10 w-1/2 self-center`}
`

const SwitchOptionTwo = styled.span`
  ${tw`font-bold uppercase z-10 w-1/2 self-center`}
`
