import React from 'react'
import { Switch } from '@headlessui/react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

// assumes options are unique
interface Props {
  enabled: boolean
  toggle: () => void
}

export const ToggleView: React.FC<Props> = ({ enabled, toggle }) => {
  return (
    <ToggleViewContainer>
      <Switch className="w-full" checked={!enabled} onChange={toggle}>
        <SwitchContainer>
          <SwitchOptionOne className={!enabled ? 'text-gray' : 'text-darkGray'}>Stake</SwitchOptionOne>
          <span
            className={`block h-full w-1/2 rounded transition duration-300 ease-in-out transform ${
              !enabled ? 'bg-white translate-x-full' : 'bg-white'
            }`}
          />
          <SwitchOptionTwo className={!enabled ? 'text-darkGray' : 'text-gray'}>Unstake</SwitchOptionTwo>
        </SwitchContainer>
      </Switch>
    </ToggleViewContainer>
  )
}

const ToggleViewContainer = styled.div`
  width: 648px;
  margin: 1.5em;
`

const SwitchContainer = styled.span`
  ${tw`bg-darkGray rounded h-14 w-full m-auto flex border`}
  border-color: '#363636'
`

const SwitchOptionOne = styled.span`
  ${tw`font-robotoMono font-bold uppercase z-10 absolute pr-8 w-1/5 self-center`}
`

const SwitchOptionTwo = styled.span`
  ${tw`font-robotoMono font-bold uppercase z-10 relative w-2/4 self-center`}
`
