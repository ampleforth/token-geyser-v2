import styled, { css } from 'styled-components/macro'
import tw from 'twin.macro'
import { Button } from 'components/Button'

export const Paragraph = styled.p`
  color: ${(props) => props.color};
  ${tw`text-base font-bold m-auto`}
`

export const Overlay = styled.div`
  ${tw`shadow-all w-full rounded-lg my-2`}
  ${tw`sm:my-4`}
`

export const ResponsiveHeader = css`
  ${tw`text-base sm:text-lg`}
`

export const ResponsiveText = css`
  ${tw`text-sm sm:text-base`}
`

export const ResponsiveSubText = css`
  ${tw`text-xs sm:text-xs`}
`

export const Centered = styled.div`
  ${tw`h-full w-full m-auto self-center`}
`

export const Ellipsis = css`
  ${tw`overflow-ellipsis overflow-hidden`}
`

// typography

export const CardLabel = styled.span`
  ${tw`flex capitalize text-black font-light`}
`

export const CardValue = styled.span`
  ${tw`flex flex-wrap text-base whitespace-pre-wrap`}
`

export const ModalButton = styled(Button)`
  width: 40%;
  ${tw`inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md`}
  ${tw`focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
`
