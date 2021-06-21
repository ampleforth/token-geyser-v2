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

export const LogoSpan = styled.span`
  ${tw` ml-4 sm:ml-20 md:ml-32 p-5 text-xl`}
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
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

// typography

export const CardLabel = styled.span`
  ${tw`flex capitalize text-gray font-light`}
`

export const CardValue = styled.span`
  ${tw`flex flex-wrap text-xl whitespace-pre-wrap`}
`

export const ModalButton = styled(Button)`
  width: 40%;
  ${tw`inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md`}
  ${tw`focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
`
