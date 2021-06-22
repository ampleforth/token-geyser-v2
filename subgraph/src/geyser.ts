// assembly script imports
import { Address, BigInt } from '@graphprotocol/graph-ts'

// template creation imports
import { InstanceAdded } from '../generated/GeyserRegistry/InstanceRegistry'
import { GeyserTemplate, PowerSwitchTemplate } from '../generated/templates'

// handler imports
import {
  BonusTokenRegistered,
  GeyserContract,
  GeyserCreated,
  GeyserFunded,
  RewardClaimed,
  Staked,
  Unstaked,
} from '../generated/templates/GeyserTemplate/GeyserContract'
import { EmergencyShutdown, PowerOff, PowerOn } from '../generated/templates/PowerSwitchTemplate/PowerSwitchContract'
import { ERC20 } from '../generated/templates/GeyserTemplate/ERC20'

// entity imports
import { ClaimedReward, Geyser, Lock, RewardPoolBalance, RewardSchedule, PowerSwitch } from '../generated/schema'

// template instantiation
export function handleNewGeyser(event: InstanceAdded): void {
  GeyserTemplate.create(event.params.instance)
}

// event handlers
function updateRewardPoolBalance(poolAddress: Address, geyserAddress: Address, tokenAddress: Address): void {
  let entity = new RewardPoolBalance(poolAddress.toHex() + '-' + tokenAddress.toHex())

  entity.geyser = geyserAddress.toHex()
  entity.pool = poolAddress
  entity.token = tokenAddress
  entity.balance = ERC20.bind(tokenAddress).balanceOf(poolAddress)

  entity.save()
}

function _updateGeyser(geyser: Geyser, geyserContract: GeyserContract, timestamp: BigInt): void {
  let geyserData = geyserContract.getGeyserData()
  let geyserAddress = Address.fromHexString(geyser.id) as Address

  geyser.totalStake = geyserData.totalStake
  geyser.totalStakeUnits = geyserContract.getCurrentTotalStakeUnits()
  geyser.unlockedReward = geyserContract.getCurrentUnlockedRewards()
  geyser.lastUpdate = timestamp

  let bonusTokens = geyser.bonusTokens
  for (let index = 0; index < bonusTokens.length; index++) {
    let tokenAddress = bonusTokens.pop() as Address
    updateRewardPoolBalance(geyserData.rewardPool, geyserAddress, tokenAddress)
  }

  geyser.save()
}

function updateGeyser(geyserAddress: Address, timestamp: BigInt): void {
  let geyser = Geyser.load(geyserAddress.toHex()) as Geyser
  let geyserContract = GeyserContract.bind(geyserAddress)
  _updateGeyser(geyser, geyserContract, timestamp)
}

export function handleGeyserCreated(event: GeyserCreated): void {
  let entity = new Geyser(event.address.toHex())
  let geyserContract = GeyserContract.bind(event.address)

  PowerSwitchTemplate.create(event.params.powerSwitch)
  let powerSwitch = new PowerSwitch(event.params.powerSwitch.toHex())
  powerSwitch.status = 'Online'
  powerSwitch.save()

  let geyserData = geyserContract.getGeyserData()

  entity.powerSwitch = event.params.powerSwitch.toHex()
  entity.rewardPool = event.params.rewardPool
  entity.stakingToken = geyserData.stakingToken
  entity.rewardToken = geyserData.rewardToken
  entity.scalingFloor = geyserData.rewardScaling.floor
  entity.scalingCeiling = geyserData.rewardScaling.ceiling
  entity.scalingTime = geyserData.rewardScaling.time
  entity.bonusTokens = []

  _updateGeyser(entity, geyserContract, event.block.timestamp)
}

export function handleGeyserFunded(event: GeyserFunded): void {
  let geyser = GeyserContract.bind(event.address)
  let geyserData = geyser.getGeyserData()

  let entity = new RewardSchedule(
    event.address.toHex() + '-' + BigInt.fromI32(geyserData.rewardSchedules.length).toString(),
  )

  let rewardScheduleData = geyserData.rewardSchedules.pop()

  entity.geyser = event.address.toHex()
  entity.rewardAmount = event.params.amount
  entity.duration = rewardScheduleData.duration
  entity.start = rewardScheduleData.start
  entity.shares = rewardScheduleData.shares

  updateGeyser(event.address, event.block.timestamp)

  entity.save()
}

export function handleBonusTokenRegistered(event: BonusTokenRegistered): void {
  let entity = Geyser.load(event.address.toHex()) as Geyser

  let bonusTokens = entity.bonusTokens
  bonusTokens.push(event.params.token)
  entity.bonusTokens = bonusTokens

  let geyserContract = GeyserContract.bind(event.address)
  _updateGeyser(entity, geyserContract, event.block.timestamp)
}

function updateVaultStake(geyserAddress: Address, vaultAddress: Address, timestamp: BigInt): void {
  let id = geyserAddress.toHex() + '-' + vaultAddress.toHex()

  let geyserContract = GeyserContract.bind(geyserAddress)

  let lock = new Lock(
    vaultAddress.toHex() + '-' + geyserAddress.toHex() + '-' + geyserContract.getGeyserData().stakingToken.toHex(),
  )
  lock.geyser = geyserAddress.toHex()
  lock.vault = vaultAddress.toHex()
  lock.stakeUnits = geyserContract.getCurrentVaultStakeUnits(vaultAddress)
  lock.amount = geyserContract.getVaultData(vaultAddress).totalStake
  lock.lastUpdate = timestamp
  lock.token = geyserContract.getGeyserData().stakingToken

  updateGeyser(geyserAddress, timestamp)

  lock.save()
}

export function handleStaked(event: Staked): void {
  updateVaultStake(event.address, event.params.vault, event.block.timestamp)
}

export function handleUnstaked(event: Unstaked): void {
  updateVaultStake(event.address, event.params.vault, event.block.timestamp)
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let id = event.params.vault.toHex() + '-' + event.params.token.toHex()

  let entity = ClaimedReward.load(id)
  if (entity == null) {
    entity = new ClaimedReward(id)
    entity.amount = BigInt.fromI32(0)
  }

  entity.vault = event.params.vault.toHex()
  entity.token = event.params.token
  entity.amount = entity.amount.plus(event.params.amount)
  entity.lastUpdate = event.block.timestamp

  updateGeyser(event.address, event.block.timestamp)

  entity.save()
}

export function handlePowerOn(event: PowerOn): void {
  let entity = new PowerSwitch(event.address.toHex())

  entity.status = 'Online'

  entity.save()
}

export function handlePowerOff(event: PowerOff): void {
  let entity = new PowerSwitch(event.address.toHex())

  entity.status = 'Offline'

  entity.save()
}

export function handleEmergencyShutdown(event: EmergencyShutdown): void {
  let entity = new PowerSwitch(event.address.toHex())

  entity.status = 'Shutdown'

  entity.save()
}
