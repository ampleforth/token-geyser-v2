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
  ${tw`flex capitalize text-gray font-light`}
`

export const CardValue = styled.span`
  ${tw`flex flex-wrap text-base whitespace-pre-wrap`}
`

export const ModalButton = styled(Button)`
  width: 40%;
  ${tw`inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md`}
  ${tw`focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
`

// loader

export const Loader = styled.div`
  height: 10px;
  aspect-ratio: 6;
  --c: #0000 64%, #000 66% 98%, #0000 101%;
  background: radial-gradient(35% 146% at 50% 159%, var(--c)) 0 0,
    radial-gradient(35% 146% at 50% -59%, var(--c)) 25% 100%;
  background-size: calc(100% / 3) 50%;
  background-repeat: repeat-x;
  clip-path: inset(0 100% 0 0);
  animation: l2 1s infinite linear;
  @keyframes l2 {
    90%,
    to {
      clip-path: inset(0);
    }
  }
`

export const LoaderDark = styled.div`
  height: 10px;
  aspect-ratio: 6;
  --c: transparent 64%, white 66% 98%, transparent 101%;
  background: radial-gradient(35% 146% at 50% 159%, var(--c)) 0 0,
    radial-gradient(35% 146% at 50% -59%, var(--c)) 25% 100%;
  background-size: calc(100% / 3) 50%;
  background-repeat: repeat-x;
  clip-path: inset(0 100% 0 0);
  animation: l2 1s infinite linear;
  @keyframes l2 {
    90%,
    to {
      clip-path: inset(0);
    }
  }
`
