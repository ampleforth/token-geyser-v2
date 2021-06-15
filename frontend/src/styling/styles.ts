import styled, { css } from 'styled-components/macro'
import tw from 'twin.macro'

export const Paragraph = styled.p`
  color: ${(props) => props.color};
  ${tw`text-base font-bold m-auto`}
`

export const GeyserFirstOverlay = styled.div`
  ${tw`shadow-lg w-full rounded-lg`}
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
