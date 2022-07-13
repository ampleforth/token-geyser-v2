import { Contract, providers, Signer } from 'ethers'
import { SignerOrProvider } from '../types'

export const loadHistoricalLogs = async (
  contract: Contract,
  eventName: string,
  signerOrProvider: SignerOrProvider,
  startBlock = 0,
  BLOCKS_PER_PART = 2102400 / 2.5,
) => {
  const signer = signerOrProvider as Signer
  const provider = signerOrProvider as providers.Provider
  const ethersProvider = signer.provider || provider
  const endBlock = await ethersProvider.getBlockNumber()
  const filter = contract.filters[eventName]()
  let logs: any[] = []
  for (let i = startBlock; i <= endBlock; i += BLOCKS_PER_PART) {
    const partEnd = Math.min(i + BLOCKS_PER_PART, endBlock)
    const partLogs = await contract.queryFilter(filter, i, partEnd)
    logs = logs.concat(partLogs)
    console.log('Loading rebase logs', i, endBlock, partLogs.length)
  }
  return logs
}
