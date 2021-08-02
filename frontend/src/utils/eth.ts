import { Contract, ethers } from 'ethers'
import { ALCHEMY_PROJECT_ID, INFURA_PROJECT_ID, UFRG_INIT_BLOCK } from '../constants'

export const getDefaultProvider = () => {
  if (process.env.NODE_ENV === 'development') {
    return new ethers.providers.JsonRpcProvider('http://localhost:8545', { name: 'localhost', chainId: 1337 })
  }

  if (INFURA_PROJECT_ID) {
    return ethers.providers.InfuraProvider.getWebSocketProvider('homestead', INFURA_PROJECT_ID)
    // return ethers.getDefaultProvider(undefined, { infura: INFURA_PROJECT_ID });
  }

  return new ethers.providers.AlchemyProvider('homestead', ALCHEMY_PROJECT_ID)
}

export const loadHistoricalLogs = async (contract: Contract, eventName: string, startBlock = UFRG_INIT_BLOCK) => {
  const filter = contract.filters[eventName]()
  return contract.queryFilter(filter, startBlock, 'latest')
}
