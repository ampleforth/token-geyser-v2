import React from 'react'
import { Tab } from '@headlessui/react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface Props {
  active:number
  tabs: string[]
  onChange: (tab:number) => void
}

export const TabView: React.FC<Props> = ({ active, tabs, onChange }) => {

  const StyledTabList = styled(Tab.List)`
    ${tw`bg-darkGray relative rounded m-auto flex border border-darkGray`}
  `

  const StyledTab = styled(Tab)`
    ${tw`outline-none  focus:outline-none`}
    ${tw`font-bold uppercase z-10 h-full block rounded self-center`}
  `

  const FlexTabWidth2 = styled(StyledTab)`
    ${tw`w-1/2`}
  `

  const FlexTabWidth3 = styled(StyledTab)`
    ${tw`w-1/3`}
  `

  const StyledFlexTab = tabs.length === 2 ? FlexTabWidth2 : FlexTabWidth3

  return (
    <Tab.Group onChange={onChange}>
      <StyledTabList className="h-14">
        {tabs.map((t, i) => (<StyledFlexTab key={t}
          className={`${active === i ? 'bg-white text-darkGray' : 'text-gray'}`}>{t}</StyledFlexTab>))}
      </StyledTabList>
    </Tab.Group>
  )
}
