import { log, dataSource, Address, BigInt } from '@graphprotocol/graph-ts'
import { LogRebase, Rebase } from '../generated/templates/RebasingERC20/RebasingERC20'
import { stringToAddress, dayTimestamp } from './utils'
import { updateGeyser } from './geyser'

function _handleRebase(address: Address, timestamp: BigInt): void {
  let context = dataSource.context()
  if (context.get('geyser') != null) {
    let id = context.getString('geyser')
    log.warning('geyserRefresh: {}', [id])
    updateGeyser(stringToAddress(id), dayTimestamp(timestamp))
  }
}

export function handleRebase(event: Rebase): void {
  log.warning('triggered handleRebase', [])
  _handleRebase(event.address, event.block.timestamp)
}

export function handleLogRebase(event: LogRebase): void {
  log.warning('triggered handleLogRebase', [])
  _handleRebase(event.address, event.block.timestamp)
}
