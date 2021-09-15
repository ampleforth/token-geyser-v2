import { TransactionResponse } from '@ethersproject/providers'
import { BigNumberish, Contract, Signer } from 'ethers'
import { ERC20_ABI } from '../sdk/abis'
import { WRAPPED_ERC20 } from './abis/WrappedERC20'

export const wrap = async (
  wrapperTokenAddress: string,
  underlyingTokenAddress: string,
  amount: BigNumberish,
  forAddress: string,
  signer: Signer,
) => {
  const wrapper = new Contract(wrapperTokenAddress, WRAPPED_ERC20, signer)
  const underlying = new Contract(underlyingTokenAddress, ERC20_ABI, signer)
  const sender = await signer.getAddress()
  const allowance = await underlying.allowance(sender, wrapperTokenAddress)
  if (allowance.lt(amount)) {
    await (await underlying.approve(wrapperTokenAddress, amount)).wait()
  }
  return wrapper.depositFor(forAddress, amount) as Promise<TransactionResponse>
}

export const unwrap = async (wrapperTokenAddress: string, amount: BigNumberish, forAddress: string, signer: Signer) => {
  const wrapper = new Contract(wrapperTokenAddress, WRAPPED_ERC20, signer)
  return wrapper.burnTo(forAddress, amount) as Promise<TransactionResponse>
}
