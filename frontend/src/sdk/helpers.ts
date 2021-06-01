import { BigNumber, Contract, Signer } from 'ethers'
import { ERC20_ABI } from './abis'

export const getTokenBalance = async (tokenAddress: string, holderAddress: string, signer: Signer) => {
  const contract = new Contract(tokenAddress, ERC20_ABI, signer)
  return contract.balanceOf(holderAddress) as Promise<BigNumber>
}
