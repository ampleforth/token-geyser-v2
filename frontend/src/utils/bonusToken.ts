import { BonusTokenInfo, SignerOrProvider } from '../types'
import { defaultTokenInfo, getTokenInfo } from './token'
import { getCurrentPrice } from './price'

export const defaultBonusTokenInfo = (): BonusTokenInfo => ({
  ...defaultTokenInfo(),
  price: 0,
})

export const getBonusTokenInfo = async (tokenAddress: string, signerOrProvider: SignerOrProvider) =>
  getBasicToken(tokenAddress, signerOrProvider)

const getBasicToken = async (tokenAddress: string, signerOrProvider: SignerOrProvider): Promise<BonusTokenInfo> => {
  const tokenInfo = await getTokenInfo(tokenAddress, signerOrProvider)
  const price = await getCurrentPrice(tokenInfo.symbol)
  return {
    ...tokenInfo,
    price,
  }
}
