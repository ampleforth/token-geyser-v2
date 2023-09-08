import { Listbox, Transition } from '@headlessui/react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import caretDown from 'assets/caret_down.svg'
import checkMark from 'assets/checkmark_light.svg'
import { Fragment } from 'react'

// needs one of options or optgroups
interface Props {
  options?: string[]
  optgroups?: { group: string; options: string[] }[]
  selectedOption: string
  onChange: (arg0: string) => void
}

export const Dropdown: React.FC<Props> = ({ options, optgroups, selectedOption, onChange }) => {
  const renderOptions = (opts: string[]) =>
    opts.map((option) => (
      <Listbox.Option
        key={option}
        className={({ active }) =>
          `${active ? 'text-primary' : 'text-gray'}
                  select-none relative py-2 pl-10 pr-4 text-left cursor-pointer`
        }
        value={option}
      >
        {({ selected }) => (
          <>
            <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>{option}</span>
            {selected ? (
              <span className={`'text-primary' absolute inset-y-0 left-0 flex items-center pl-3`}>
                <Img src={checkMark} alt="Selected" />
              </span>
            ) : null}
          </>
        )}
      </Listbox.Option>
    ))

  const renderOptgroups = (groups: { group: string; options: string[] }[]) =>
    groups.map(({ group, options: opts }) => (
      <div key={group}>
        <Listbox.Option disabled className="text-gray align-center justify-center flex" value={group}>
          <span>{group}</span>
        </Listbox.Option>
        {renderOptions(opts)}
      </div>
    ))

  return (
    <Listbox value={selectedOption} onChange={onChange}>
      <OptionsWrapper>
        <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-paleBlue rounded-lg shadow-all-xs cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white sm:text-sm">
          <span className="block truncate">{selectedOption}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Img src={caretDown} alt="Down arrow" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="z-10 absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-all-xs max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {optgroups ? renderOptgroups(optgroups) : renderOptions(options || [])}
          </Listbox.Options>
        </Transition>
      </OptionsWrapper>
    </Listbox>
  )
}

const Img = styled.img`
  ${tw`w-5 h-5 text-gray`}
`

const OptionsWrapper = styled.div`
  ${tw`relative mt-1 w-336px`}
`
