import { BigNumber, Contract, providers, Signer } from 'ethers'
import { ERC20_ABI } from './abis'

function _execTokenFunction<T>(
  tokenAddress: string,
  signerOrProvider: Signer | providers.Provider,
  fnc: string,
  args: any[] = [],
): Promise<T> {
  const token = new Contract(tokenAddress, ERC20_ABI, signerOrProvider)
  return token[fnc](...args) as Promise<T>
}

export const ERC20Decimals = async (tokenAddress: string, signerOrProvider: Signer | providers.Provider) => {
  return _execTokenFunction<number>(tokenAddress, signerOrProvider, 'decimals')
}

export const ERC20Name = async (tokenAddress: string, signerOrProvider: Signer | providers.Provider) => {
  return _execTokenFunction<string>(tokenAddress, signerOrProvider, 'name')
}

export const ERC20Symbol = async (tokenAddress: string, signerOrProvider: Signer | providers.Provider) => {
  return _execTokenFunction<string>(tokenAddress, signerOrProvider, 'symbol')
}

export const ERC20Balance = async (
  tokenAddress: string,
  holderAddress: string,
  signerOrProvider: Signer | providers.Provider,
) => {
  return _execTokenFunction<BigNumber>(tokenAddress, signerOrProvider, 'balanceOf', [holderAddress])
}
