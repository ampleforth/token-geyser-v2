import { useState, useRef, useEffect, Fragment } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { useSpring, animated } from 'react-spring'
import { Popover, Transition } from '@headlessui/react'
import { ResponsiveSubText, ResponsiveText } from 'styling/styles'
import { TooltipMessage } from 'types'

interface Props {
  name: string
  value: number
  units: string
  from?: number
  interpolate?: (val: number) => string
  containerClassName?: string
  tooltipMessage?: TooltipMessage
}

export const GeyserStatsBox: React.FC<Props> = ({
  name,
  value: targetValue,
  units,
  from,
  interpolate,
  containerClassName,
  tooltipMessage,
}) => {
  const [statsValue, setStatsValue] = useState<string>(interpolate ? interpolate(targetValue) : `${targetValue}`)
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const [clicked, setClicked] = useState(false)

  const popoverRef = useRef<HTMLDivElement>(null)

  useSpring({
    val: targetValue,
    from: { val: from || 0 },
    onChange: ({ value }) => {
      setStatsValue(interpolate ? interpolate(value.val) : `${value.val}`)
    },
  })

  if (!tooltipMessage) {
    return (
      <GeyserStatsBoxContainer className={`relative ${containerClassName}`}>
        <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
        <GeyserStatsBoxValueContainer>
          <GeyserStatsBoxValue>
            <animated.span>{statsValue}</animated.span> <GeyserStatsBoxUnits>{units}</GeyserStatsBoxUnits>
          </GeyserStatsBoxValue>
        </GeyserStatsBoxValueContainer>
      </GeyserStatsBoxContainer>
    )
  }

  const handleMouseEnter = () => {
    if (!clicked) {
      setIsTooltipOpen(true)
    }
  }

  const handleMouseLeave = () => {
    // Only close if not locked open by a click
    if (!clicked) {
      setIsTooltipOpen(false)
    }
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsTooltipOpen((prev) => !prev)
    setClicked((prev) => !prev)
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isTooltipOpen && popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsTooltipOpen(false)
        setClicked(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isTooltipOpen])

  return (
    <GeyserStatsBoxContainer className={`relative ${containerClassName}`}>
      <GeyserStatsBoxLabel>{name}</GeyserStatsBoxLabel>
      <GeyserStatsBoxValueContainer>
        {/* Wrap Popover in a DOM element to attach ref */}
        <div ref={popoverRef} className="relative inline-block">
          <Popover>
            <Popover.Button
              onClick={handleTitleClick}
              onMouseEnter={tooltipMessage ? handleMouseEnter : undefined}
              onMouseLeave={tooltipMessage ? handleMouseLeave : undefined}
              tabIndex={0}
            >
              <GeyserStatsBoxValueWithTooltip>
                <animated.span>{statsValue}</animated.span> <GeyserStatsBoxUnits>{units}</GeyserStatsBoxUnits>
              </GeyserStatsBoxValueWithTooltip>
            </Popover.Button>

            {tooltipMessage && (
              <Transition
                as={Fragment}
                show={isTooltipOpen}
                enter="transition-all ease-out duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition-all ease-in duration-100"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel
                  className="absolute z-30 w-max max-w-sm mt-3 -ml-3 transform"
                  onClick={(e) => e.stopPropagation()}
                  // Keep popover open if cursor inside the panel
                  onMouseEnter={() => setIsTooltipOpen(true)}
                  onMouseLeave={() => {
                    if (!clicked) setIsTooltipOpen(false)
                  }}
                >
                  <TooltipOuterLayer>
                    <TooltipInnerLayer>
                      <TooltipMessageContainer key={tooltipMessage.title}>
                        <TooltipTitle>{tooltipMessage.title}</TooltipTitle>
                        <TooltipBody>{tooltipMessage.body}</TooltipBody>
                      </TooltipMessageContainer>
                    </TooltipInnerLayer>
                  </TooltipOuterLayer>
                </Popover.Panel>
              </Transition>
            )}
          </Popover>
        </div>
      </GeyserStatsBoxValueContainer>
    </GeyserStatsBoxContainer>
  )
}

const GeyserStatsBoxContainer = styled.div`
  ${tw`w-full h-40px`}
  ${tw`sm:mr-5 sm:p-3 sm:h-72px`}
  ${tw`sm:bg-paleBlue sm:border sm:border-lightGray sm:rounded-sm`}
`

const GeyserStatsBoxLabel = styled.span`
  ${ResponsiveText}
  ${tw`mb-1 flex font-light relative`}
`

const GeyserStatsBoxValueContainer = styled.div`
  ${tw`flex flex-row`}
`

const GeyserStatsBoxValue = styled.span`
  ${ResponsiveText}
`

const GeyserStatsBoxValueWithTooltip = styled.span`
  ${ResponsiveText}
  ${tw`cursor-pointer border-b border-dotted border-darkGray transition-all ease-out duration-100`} 
  &:hover {
    ${tw`border-b-2 border-greenDark border-dashed`}
  }
`

const GeyserStatsBoxUnits = styled.span`
  ${ResponsiveSubText}
`

const TooltipOuterLayer = styled.div`
  ${tw`shadow-all max-w-sm rounded-lg overflow-hidden ring-1 ring-black ring-opacity-5`}
`

const TooltipInnerLayer = styled.div`
  ${tw`relative grid gap-6 bg-black p-6`}
`

const TooltipMessageContainer = styled.div`
  ${tw`m-auto`}
`

const TooltipTitle = styled.p`
  ${ResponsiveText}
  ${tw`text-gray mb-2`}
`

const TooltipBody = styled.div`
  ${ResponsiveSubText}
  ${tw`text-white text-left font-semiBold`}
`
