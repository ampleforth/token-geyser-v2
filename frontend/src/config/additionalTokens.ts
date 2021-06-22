import { AdditionalTokenConfig } from 'types'

/**
 * `address` should be the actual address of the token. Only the `address` and `enabled` key is used
 */
const mockAdditionalTokens = [
  {
    token: 'mock bal',
    address: '0x',
    enabled: false,
  },
  {
    token: 'mock sushi',
    address: '0x',
    enabled: false,
  },
]

const mainnetAdditionalTokens = [
  {
    token: 'balancer',
    address: '0xba100000625a3754423978a60c9317c58a424e3d',
    enabled: true,
  },
  {
    token: 'sushi',
    address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    enabled: true,
  },
]

export const additionalTokens: AdditionalTokenConfig[] =
  process.env.NODE_ENV === 'development' ? mockAdditionalTokens : mainnetAdditionalTokens
