import { Contract, ethers } from 'ethers'
import { UFRG_INIT_BLOCK } from '../constants'

export const getDefaultProvider = () => {
  if (process.env.NODE_ENV === 'development') {
    return new ethers.providers.JsonRpcProvider('http://localhost:8545', { name: 'localhost', chainId: 1337 })
  }
  // TODO: pass infura api key as param
  return ethers.getDefaultProvider()
}

export const loadHistoricalLogs = async (contract: Contract, eventName: string, startBlock = UFRG_INIT_BLOCK) => {
  const filter = contract.filters[eventName]()
  return contract.queryFilter(filter, startBlock, 'latest')
}
