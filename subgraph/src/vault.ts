// assembly script imports
import { Address, BigInt } from '@graphprotocol/graph-ts'

// template creation imports
import { InstanceAdded } from '../generated/VaultFactory/InstanceRegistry'
import { VaultTemplate } from '../generated/templates'

// handler imports
import { Lock, LockedBalance, User, Vault } from '../generated/schema'
import { Transfer } from '../generated/UniversalVaultNFT/ERC721'

// entity imports
import { Locked, RageQuit, Unlocked, VaultContract } from '../generated/templates/VaultTemplate/VaultContract'

// template instantiation
function updateVault(vaultAddress: Address): void {
  let vault = new Vault(vaultAddress.toHex())

  let vaultContract = VaultContract.bind(vaultAddress)

  let owner = vaultContract.owner()
  let user = new User(owner.toHex())

  vault.owner = owner.toHex()
  vault.nonce = vaultContract.getNonce()

  user.save()
  vault.save()
}

export function handleNewVault(event: InstanceAdded): void {
  VaultTemplate.create(event.params.instance)

  updateVault(event.params.instance)
}

// event handlers
function updateLock(vaultAddress: Address, geyserAddress: Address, tokenAddress: Address, timestamp: BigInt): void {
  updateVault(vaultAddress)

  let vaultContract = VaultContract.bind(vaultAddress)
  let lock = new Lock(vaultAddress.toHex() + '-' + geyserAddress.toHex() + '-' + tokenAddress.toHex())
  let lockedBalance = new LockedBalance(vaultAddress.toHex() + '-' + tokenAddress.toHex())

  lock.amount = vaultContract.getBalanceDelegated(tokenAddress, geyserAddress)
  lock.geyser = geyserAddress.toHex()
  lock.vault = vaultAddress.toHex()
  lock.token = tokenAddress
  lock.lastUpdate = timestamp

  lockedBalance.amount = vaultContract.getBalanceLocked(tokenAddress)
  lockedBalance.vault = vaultAddress.toHex()
  lockedBalance.token = tokenAddress
  lockedBalance.lastUpdate = timestamp

  lock.save()
  lockedBalance.save()
}

export function handleLocked(event: Locked): void {
  updateLock(event.address, event.params.delegate, event.params.token, event.block.timestamp)
}

export function handleUnlocked(event: Unlocked): void {
  updateLock(event.address, event.params.delegate, event.params.token, event.block.timestamp)
}

export function handleRageQuit(event: RageQuit): void {
  updateLock(event.address, event.params.delegate, event.params.token, event.block.timestamp)
}

function bigIntToAddress(value: BigInt): Address {
  return Address.fromString(value.toHex().slice(2).padStart(40, '0'))
}

export function handleTransfer(event: Transfer): void {
  let from = new User(event.params.from.toHex())
  updateVault(bigIntToAddress(event.params.tokenId))
  from.save()
}
