import { BigNumber, Contract, Signer } from 'ethers'
import { ERC20_ABI } from './abis'

export async function getTokenBalances(tokenAddresses: string[], vaultAddress: string, signer: Signer) {
  const contracts = tokenAddresses.map((tokenAddress) => new Contract(tokenAddress, ERC20_ABI, signer))
  const balances = await Promise.allSettled(contracts.map((contract) => contract.balanceOf(vaultAddress)))
  return balances as PromiseSettledResult<BigNumber>[]
}
