import { BigNumber, Contract, Signer } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { ERC20_ABI } from './abis'

function _execTokenFunction<T>(tokenAddress: string, signer: Signer, fnc: string, args: any[] = []): Promise<T> {
  const token = new Contract(tokenAddress, ERC20_ABI, signer)
  return token[fnc](...args) as Promise<T>
}

export const ERC20Decimals = async (tokenAddress: string, signer: Signer) => {
  return _execTokenFunction<number>(tokenAddress, signer, 'decimals')
}

export const ERC20Name = async (tokenAddress: string, signer: Signer) => {
  return _execTokenFunction<string>(tokenAddress, signer, 'name')
}

export const ERC20Symbol = async (tokenAddress: string, signer: Signer) => {
  return _execTokenFunction<string>(tokenAddress, signer, 'symbol')
}

export const ERC20Balance = async (tokenAddress: string, holderAddress: string, signer: Signer) => {
  return _execTokenFunction<BigNumber>(tokenAddress, signer, 'balanceOf', [holderAddress])
}

export const parseUnitsWithDecimals = async (value: string, tokenAddress: string, signer: Signer) => {
  return parseUnits(value, await ERC20Decimals(tokenAddress, signer))
}
