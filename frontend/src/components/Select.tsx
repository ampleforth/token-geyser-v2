import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, SelectorIcon } from '@heroicons/react/solid'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

export interface Option {
  id: string
  name: string
}

interface Props {
  selected: number
  options: Option[]
  onChange?: (option: number) => void
  disabled?: boolean
}

const StyledListboxButton = styled(Listbox.Button)`
  ${tw`relative w-full mt-2 mb-2 py-2 pl-3 pr-10 text-left bg-white rounded-md shadow-md sm:text-lg shadow-none flex flex-row border border-gray h-fit mb-3 mt-1 rounded-md`}
  ${tw`cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-primary focus-visible:ring-offset-2 focus-visible:border-primary`}
`

const StyledListboxOptions = styled(Listbox.Options)`
  ${tw`absolute w-full py-1 mt-1 overflow-auto text-base text-left bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 sm:text-lg`}
  ${tw`focus:outline-none z-10`}
`

const StyledSelectorIconContainer = styled.span`
  ${tw`absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none`}
`

const StyledSelectorIcon = styled(SelectorIcon)`
  ${tw`w-5 h-5 text-darkGray`}
`

const StyledCheckIconContainer = styled.span`
  ${tw`absolute inset-y-0 left-0 flex items-center pl-3`}
`

const StyledCheckIcon = styled(CheckIcon)`
  ${tw`w-5 h-5`}
`

const noOp = () => {}

export const Select: React.FC<Props> = ({ selected, options, onChange, disabled }) => (
  <Listbox value={selected} onChange={onChange || noOp} disabled={disabled || false}>
    <div className="relative mt-1 w-full">
      <StyledListboxButton>
        <span className="block truncate">{options[selected].name}</span>
        {!disabled ? (
          <StyledSelectorIconContainer>
            <StyledSelectorIcon />
          </StyledSelectorIconContainer>
        ) : null}
      </StyledListboxButton>
      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
        <StyledListboxOptions>
          {options.map((o, i) => (
            <Listbox.Option
              key={o.id}
              className={({ active }) => `cursor-default relative py-2 pl-10 pr-4 ${active ? 'bg-lightGray' : null}`}
              value={i}
            >
              {({ selected: optionSelected }) => (
                <>
                  <span className={`text-black block truncate ${optionSelected ? 'font-medium' : 'font-normal'}`}>
                    {o.name}
                  </span>
                  {optionSelected ? (
                    <StyledCheckIconContainer>
                      <StyledCheckIcon />
                    </StyledCheckIconContainer>
                  ) : null}
                </>
              )}
            </Listbox.Option>
          ))}
        </StyledListboxOptions>
      </Transition>
    </div>
  </Listbox>
)
