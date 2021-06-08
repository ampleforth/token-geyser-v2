import { toChecksumAddress } from 'web3-utils'

const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(addr.length - 4)}`
export const displayAddr = (addr: string) => formatAddr(toChecksumAddress(addr))
