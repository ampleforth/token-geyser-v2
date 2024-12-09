import { Popover, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { TooltipMessage } from 'types'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'

interface Props {
  messages: TooltipMessage[]
  classNames?: string
  panelClassnames?: string
}

export const Tooltip: React.FC<Props> = ({ messages, classNames, panelClassnames }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleMouseEnter = () => {
    if (!isOpen) setIsOpen(true)
  }

  const handleClick = () => setIsOpen((prev) => !prev)
  const handleOutsideClick = () => setIsOpen(false)

  return (
    <Popover className={`font-normal relative ${classNames}`} onMouseLeave={handleOutsideClick}>
      <Popover.Button
        className="flex focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        <InformationCircleIcon className="h-5 w-5" />
      </Popover.Button>
      <Transition
        as={Fragment}
        show={isOpen} // Control visibility with state
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel
          className={`absolute z-30 w-screen max-w-sm px-4 mt-3 transform ${panelClassnames}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={handleOutsideClick}
        >
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
}

const OuterLayer = styled.div`
  ${tw`shadow-all max-w-sm rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5`}
`

const InnerLayer = styled.div`
  ${tw`relative gap-6 bg-black p-6`}
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
  ${tw`text-white text-left font-semiBold`}
`
