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
  box-shadow: 0px -2px 25px -3px rgb(0 0 0 / 10%);
  border-radius: 10px;
  width: 100%;
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
  ${ResponsiveText}
  ${tw`text-xs sm:text-xs`}
`
