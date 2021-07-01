import { Popover, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import info from 'assets/info.svg'
import { TooltipMessage } from 'types'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'

interface Props {
  messages: TooltipMessage[]
  classNames?: string
  panelClassnames?: string
}

export const Tooltip: React.FC<Props> = ({ messages, classNames, panelClassnames }) => (
  <Popover className={`font-normal relative bg-white ${classNames}`}>
    <Popover.Button className="flex">
      <img src={info} alt="Info" />
    </Popover.Button>
    <Transition
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
    >
      <Popover.Panel className={`absolute z-30 w-screen max-w-sm px-4 mt-3 transform ${panelClassnames}`}>
        <OuterLayer>
          <InnerLayer>
            {messages.map(({ title, body }) => (
              <Message key={title}>
                <Title>{title}</Title>
                <Body>{body}</Body>
              </Message>
            ))}
          </InnerLayer>
        </OuterLayer>
      </Popover.Panel>
    </Transition>
  </Popover>
)

const OuterLayer = styled.div`
  ${tw`shadow-all max-w-sm rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5`}
`

const InnerLayer = styled.div`
  ${tw`relative grid gap-6 bg-white p-6`}
`

const Message = styled.div`
  ${tw`m-auto`}
`

const Title = styled.p`
  ${ResponsiveText}
  ${tw`text-gray mb-2`}
`

const Body = styled.p`
  ${ResponsiveSubText}
  ${tw`text-black text-left`}
`
