// Collective place for unsiversal mixins
import { css } from 'styled-components/macro'

export const PaddedDiv = (padding: string) => css`
  padding: ${padding};
`

export const Aligned = (alignment: string) => css`
  text-align: ${alignment};
`
