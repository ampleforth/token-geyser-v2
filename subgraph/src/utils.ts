import { Address, BigInt } from '@graphprotocol/graph-ts'

export let bigIntZero = BigInt.fromI32(0)

export const dayTimestamp = (timestamp: BigInt): BigInt => {
  return timestamp.minus(timestamp % BigInt.fromI32(24 * 3600))
}

export const stringToAddress = (id: string): Address => {
  return Address.fromString(id)
}
