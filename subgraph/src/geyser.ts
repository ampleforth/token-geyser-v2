// assembly script imports
import { Address, BigInt, DataSourceContext } from '@graphprotocol/graph-ts'

// template creation imports
import { InstanceAdded } from '../generated/GeyserRegistry/InstanceRegistry'
import { GeyserTemplate, PowerSwitchTemplate } from '../generated/templates'

// debug
import { log } from '@graphprotocol/graph-ts'

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
import { RebasingERC20 } from '../generated/templates'

// entity imports
import {
  ClaimedReward,
  Geyser,
  GeyserDailyStat,
  Lock,
  RewardPoolBalance,
  RewardSchedule,
  PowerSwitch,
} from '../generated/schema'

// utils
import { bigIntZero, dayTimestamp, stringToAddress } from './utils'

// template instantiation
export function handleNewGeyser(event: InstanceAdded): void {
  log.info('New geyser added: {}', [event.params.instance.toString()])
  GeyserTemplate.create(event.params.instance)
}

// event handlers
function updateRewardPoolBalance(
  poolAddress: Address,
  geyserAddress: Address,
  tokenAddress: Address,
  timestamp: BigInt,
): void {
  let entity = new RewardPoolBalance(poolAddress.toHex() + '-' + tokenAddress.toHex())

  entity.geyser = geyserAddress.toHex()
  entity.pool = poolAddress
  entity.token = tokenAddress
  entity.balance = ERC20.bind(tokenAddress).balanceOf(poolAddress)
  entity.lastUpdate = timestamp

  entity.save()
}

function _updateGeyser(geyser: Geyser, geyserContract: GeyserContract, timestamp: BigInt): void {
  let geyserData = geyserContract.getGeyserData()
  let geyserAddress = stringToAddress(geyser.id)

  geyser.totalStake = geyserData.totalStake
  let tryTotalStakeUnits = geyserContract.try_getCurrentTotalStakeUnits()
  if (!tryTotalStakeUnits.reverted) {
    geyser.totalStakeUnits = tryTotalStakeUnits.value
  } else {
    log.warning('Failed to get totalStakeUnits for geyser: {}', [geyser.id])
  }
  let tryUnlockedReward = geyserContract.try_getCurrentUnlockedRewards()
  if (!tryUnlockedReward.reverted) {
    geyser.unlockedReward = tryUnlockedReward.value
  } else {
    log.warning('Failed to get unlockedReward for geyser: {}', [geyser.id])
  }
  geyser.rewardBalance = ERC20.bind(geyserData.rewardToken).balanceOf(geyserData.rewardPool)
  geyser.lastUpdate = timestamp

  let bonusTokens = geyser.bonusTokens
  for (let index = 0; index < bonusTokens.length; index++) {
    let tokenAddress = bonusTokens.pop() as Address
    updateRewardPoolBalance(geyserData.rewardPool, geyserAddress, tokenAddress, timestamp)
  }

  geyser.save()
}

function _updateGeyserStats(
  geyser: Geyser,
  stat: GeyserDailyStat,
  geyserContract: GeyserContract,
  timestamp: BigInt,
): void {
  let geyserAddress = stringToAddress(geyser.id)
  let geyserContract = GeyserContract.bind(geyserAddress)
  let geyserData = geyserContract.getGeyserData()

  stat.geyser = geyser.id
  stat.timestamp = timestamp
  stat.unlockedReward = geyser.unlockedReward
  stat.rewardBalance = geyser.rewardBalance
  stat.totalStake = geyser.totalStake
  stat.totalStakeUnits = geyser.totalStakeUnits
  stat.rewardPoolBalances = []
  let bonusTokens = geyser.bonusTokens
  for (let index = 0; index < bonusTokens.length; index++) {
    let tokenAddress = bonusTokens.pop() as Address
    stat.rewardPoolBalances.push(ERC20.bind(tokenAddress).balanceOf(geyserData.rewardPool))
  }
  stat.save()
}

export function updateGeyser(geyserAddress: Address, timestamp: BigInt): void {
  let geyser = Geyser.load(geyserAddress.toHex()) as Geyser
  let geyserContract = GeyserContract.bind(geyserAddress)
  _updateGeyser(geyser, geyserContract, timestamp)

  let dayTs = dayTimestamp(timestamp)
  let statId = geyser.id.concat('-').concat(dayTs.toString())
  let stat = GeyserDailyStat.load(statId)
  if (stat === null) {
    stat = new GeyserDailyStat(statId)
  }
  _updateGeyserStats(geyser, stat as GeyserDailyStat, geyserContract, dayTs)
}

export function handleGeyserCreated(event: GeyserCreated): void {
  let id = event.address.toHex()
  let entity = new Geyser(id)
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
  entity.unlockedReward = bigIntZero
  entity.rewardBalance = bigIntZero
  entity.totalStake = bigIntZero
  entity.totalStakeUnits = bigIntZero
  entity.lastUpdate = bigIntZero
  entity.bonusTokens = []
  entity.save()

  let context = new DataSourceContext()
  context.setString('geyser', id)
  RebasingERC20.createWithContext(geyserData.rewardToken, context)

  updateGeyser(event.address, event.block.timestamp)
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
  entity.save()

  updateGeyser(event.address, event.block.timestamp)
}

export function handleBonusTokenRegistered(event: BonusTokenRegistered): void {
  let entity = Geyser.load(event.address.toHex()) as Geyser

  let bonusTokens = entity.bonusTokens
  bonusTokens.push(event.params.token)
  entity.bonusTokens = bonusTokens
  entity.save()

  updateGeyser(event.address, event.block.timestamp)
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
  lock.save()

  updateGeyser(geyserAddress, timestamp)
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
  entity.save()

  updateGeyser(event.address, event.block.timestamp)
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
