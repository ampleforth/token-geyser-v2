// Collective place for universal styles
import styled, { css } from 'styled-components/macro'
import tw from 'twin.macro'

// TODO: Set up theming, media breakpoints styling, typography

export const Paragraph = styled.p`
  color: ${(props) => props.color};
  font-size: 1rem;
  font-weight: bold;
  margin: auto;
`

export const GeyserFirstOverlay = styled.div`
  ${tw`shadow-lg w-full rounded-lg`}
`

export const LogoDiv = styled.div`
  font-family: 'Coromont Garamond';
  text-transform: none;
  font-size: 1.75rem;
  padding: 10px;
  padding-left: 20px;
  padding-right: 22px;
`

export const ResponsiveText = css`
  ${tw`text-sm sm:text-base`}
`

export const ResponsiveSubText = css`
  ${tw`text-xs sm:text-xs`}
`
