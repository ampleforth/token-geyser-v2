import { Contract, ethers } from 'ethers'
import { INFURA_PROJECT_ID, UFRG_INIT_BLOCK } from '../constants'

export const getDefaultProvider = () => {
  if (process.env.NODE_ENV === 'development') {
    return new ethers.providers.JsonRpcProvider('http://localhost:8545', { name: 'localhost', chainId: 1337 })
  }
  const options = INFURA_PROJECT_ID ? { infura: INFURA_PROJECT_ID } : undefined
  return ethers.getDefaultProvider(undefined, options)
}

export const loadHistoricalLogs = async (contract: Contract, eventName: string, startBlock = UFRG_INIT_BLOCK) => {
  const filter = contract.filters[eventName]()
  return contract.queryFilter(filter, startBlock, 'latest')
}
