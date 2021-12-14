import { Contract, providers, Signer } from 'ethers'
import { ALCHEMY_PROJECT_ID, INFURA_PROJECT_ID } from '../constants'
import { SignerOrProvider } from '../types'

export const getDefaultProvider = () => {
  if (process.env.NODE_ENV === 'development') {
    return new providers.JsonRpcProvider('http://localhost:8545', { name: 'localhost', chainId: 1337 })
  }

  if (ALCHEMY_PROJECT_ID) {
    return new providers.AlchemyProvider('homestead', ALCHEMY_PROJECT_ID)
  }

  // return ethers.getDefaultProvider(undefined, { infura: INFURA_PROJECT_ID });
  return providers.InfuraProvider.getWebSocketProvider('homestead', INFURA_PROJECT_ID)
}

export const loadHistoricalLogs = async (
  contract: Contract,
  eventName: string,
  signerOrProvider: SignerOrProvider,
  startBlock = 0,
  BLOCKS_PER_PART = 20000,
) => {
  const signer = signerOrProvider as Signer
  const provider = signerOrProvider as providers.Provider
  const endBlock = (await signer.provider?.getBlockNumber()) || (await provider.getBlockNumber())
  const filter = contract.filters[eventName]()
  let logs: any[] = []
  for (let i = startBlock; i <= endBlock; i += BLOCKS_PER_PART) {
    const partEnd = Math.min(i + BLOCKS_PER_PART, endBlock)
    const partLogs = await contract.queryFilter(filter, i, partEnd)
    logs = logs.concat(partLogs)
  }
  return logs
}
