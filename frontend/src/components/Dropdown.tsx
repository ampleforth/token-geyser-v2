import { Listbox, Transition } from '@headlessui/react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import caretDown from 'assets/caret_down.svg'
import checkMark from 'assets/checkmark_light.svg'
import { Fragment } from 'react'

interface Props {
  options: string[]
  selectedOption: string
  onChange: (arg0: string) => void
}

export const Dropdown: React.FC<Props> = ({ options, selectedOption, onChange }) => {
  return (
    <Listbox value={selectedOption} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-orange-300 focus-visible:ring-offset-2 focus-visible:border-indigo-500 sm:text-sm">
          <span className="block truncate">{selectedOption}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Img src={caretDown} alt="Down arrow" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((option) => (
              <Listbox.Option
                key={option}
                className={({ active }) =>
                  `${active ? 'text-primary' : 'text-gray'}
                          cursor-default select-none relative py-2 pl-10 pr-4`
                }
                value={option}
              >
                {({ selected, active }) => (
                  <>
                    <span className={`${selected ? 'font-medium' : 'font-normal'} ablock truncate`}>{option}</span>
                    {selected ? (
                      <span
                        className={`'text-primary'}
                                absolute inset-y-0 left-0 flex items-center pl-3`}
                      >
                        <Img src={checkMark} alt="Selected" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

const Img = styled.img`
  ${tw`w-5 h-5 text-gray`}
`
