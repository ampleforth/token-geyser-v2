import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'
import { BigNumber, BigNumberish, Contract, Signer, Wallet } from 'ethers'
import { randomBytes } from 'ethers/lib/utils'
import { ERC20_ABI } from './abis'
import { getBalanceLocked, getRewardsClaimedFromUnstake } from './stats'
import { ERC20Balance } from './tokens'
import { isPermitable, loadNetworkConfig, signPermission, signPermitEIP2612 } from './utils'
import { toChecksumAddress } from 'web3-utils'

// End to end user flow
// 1) Create vault: `create()`
// 2) Depost staking tokens to vault: `deposit()`
// 3) Stake to geyser: `stake()`
// 4) Unstake from geyser: `unstake()`
// 5) Withdraw from vault: `withdraw()`

// Note
// - actions 1-3 can be combined into two transactions using `approveCreateDepositStake()`
// - actions 1-3 can be combined into single transaction using `permitCreateDepositStake()` function for permit enabled tokens
// - actions 2-3 can be combined into single transaction using `permitDepositStake()` function for permit enabled tokens

/// Core Actions ///

export const create = async (signer: Signer) => {
  const config = await loadNetworkConfig(signer)

  const vaultFactory = new Contract(config.VaultFactory.address, config.VaultFactory.abi, signer)

  const vaultAddress = await vaultFactory.callStatic['create()']()

  await vaultFactory['create()']()

  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  return vault
}

export const deposit = async (vaultAddress: string, tokenAddress: string, amount: BigNumberish, signer: Signer) => {
  const token = new Contract(tokenAddress, ERC20_ABI, signer)

  return token.transfer(vaultAddress, amount) as Promise<TransactionResponse>
}

export const stake = async (geyserAddress: string, vaultAddress: string, amount: BigNumberish, signer: Wallet) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken

  const permission = signPermission('Lock', vault, signer, geyser.address, tokenAddress, amount)

  return geyser.stake(vault.address, amount, permission) as Promise<TransactionResponse>
}

export const unstake = async (geyserAddress: string, vaultAddress: string, amount: BigNumberish, signer: Wallet) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken

  const permission = signPermission('Unlock', vault, signer, geyser.address, tokenAddress, amount)

  return geyser.unstakeAndClaim(vault.address, amount, permission) as Promise<TransactionResponse>
}

export const withdraw = async (
  vaultAddress: string,
  tokenAddress: string,
  recipientAddress: string,
  amount: BigNumberish,
  signer: Signer,
) => {
  const config = await loadNetworkConfig(signer)

  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)
  const token = new Contract(tokenAddress, ERC20_ABI, signer)

  return vault.transferERC20(token.address, recipientAddress, amount) as Promise<TransactionResponse>
}

// The transaction receipt must be the receipt from unstaking
export const withdrawRewards = async (
  geyserAddress: string,
  recipientAddress: string,
  receipt: TransactionReceipt,
  signer: Signer,
) => {
  const claimedRewards = await getRewardsClaimedFromUnstake(receipt, geyserAddress, signer)
  if (!claimedRewards) return null
  const { vault, token, amount } = claimedRewards
  const rewards = BigNumber.from(amount)
  if (rewards.isZero()) return null
  return {
    response: await withdraw(vault, token, recipientAddress, rewards, signer),
    rewards,
  }
}

export const withdrawUnlocked = async (
  vaultAddress: string,
  tokenAddress: string,
  recipientAddress: string,
  signer: Signer,
) => {
  const unlockedBalance = (await ERC20Balance(tokenAddress, vaultAddress, signer)).sub(
    await getBalanceLocked(vaultAddress, tokenAddress, signer),
  )

  if (unlockedBalance.isZero()) return null
  return {
    response: await withdraw(vaultAddress, tokenAddress, recipientAddress, unlockedBalance, signer),
    amount: unlockedBalance,
  }
}

/// Combined Actions ///

export const approveCreateDepositStake = async (geyserAddress: string, amount: BigNumberish, signer: Wallet) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(config.RouterV1.address, config.RouterV1.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const token = new Contract(tokenAddress, ERC20_ABI, signer)

  const salt = randomBytes(32)
  const vaultAddress = await router.callStatic.create2Vault(config.VaultFactory.address, salt)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)
  const lockPermission = await signPermission('Lock', vault, signer, geyserAddress, token.address, amount, '0')
  const args = [geyserAddress, config.VaultFactory.address, await signer.getAddress(), amount, salt, lockPermission]

  const allowance = await token.allowance(signer.getAddress(), router.address)
  if (allowance.lt(amount)) {
    await (await token.approve(router.address, amount)).wait()
  }
  return router.create2VaultAndStake(...args) as Promise<TransactionResponse>
}

export const approveDepositStake = async (
  geyserAddress: string,
  vaultAddress: string,
  amountToStake: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)
  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const token = new Contract(tokenAddress, ERC20_ABI, signer)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  // calculate stakable balance in the vault
  let stakableAmountInVault = (await token.balanceOf(vault.address)).sub(
    await vault.getBalanceDelegated(token.address, geyser.address),
  )

  // The remaining amount gets transferred from the user's wallet to the vault
  const remainingAmountToTransfer = BigNumber.from(amountToStake).sub(stakableAmountInVault)
  if (remainingAmountToTransfer.gt(0)) {
    await (await token.transfer(vault.address, remainingAmountToTransfer)).wait()
  }

  const lockPermission = await signPermission('Lock', vault, signer, geyserAddress, token.address, amountToStake)
  const args = [vaultAddress, amountToStake, lockPermission]

  const r = geyser.stake(...args)
  await (await r).wait()
  return r as Promise<TransactionResponse>
}

export const permitCreateDepositStake = async (geyserAddress: string, amount: BigNumberish, signer: Wallet) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(config.RouterV1.address, config.RouterV1.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const deadline = (await signer.provider.getBlock('latest')).timestamp + 60 * 60 * 24

  if (!isPermitable(tokenAddress)) {
    throw new Error('Staking token not recognized as having EIP2612 permit() interface')
  }

  const salt = randomBytes(32)
  const vaultAddress = await router.callStatic.create2Vault(config.VaultFactory.address, salt)
  const vault = new Contract(vaultAddress, config.VaultTemplate.address, signer)

  const permit = await signPermitEIP2612(signer, tokenAddress, router.address, amount, deadline)

  const lockPermission = await signPermission('Lock', vault, signer, geyserAddress, tokenAddress, amount, 0)

  const args = [geyserAddress, config.VaultFactory.address, await signer.getAddress(), salt, permit, lockPermission]

  return router.create2VaultPermitAndStake(...args) as Promise<TransactionResponse>
}

// TODO: handle unlocked amounts in the vault, like in approveDepositStake
export const permitDepositStake = async (
  geyserAddress: string,
  vaultAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(config.RouterV1.address, config.RouterV1.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const deadline = (await signer.provider.getBlock('latest')).timestamp + 60 * 60 * 24

  if (!isPermitable(tokenAddress)) {
    throw new Error('Staking token not recognized as having EIP2612 permit() interface')
  }

  const vault = new Contract(vaultAddress, config.VaultTemplate.address, signer)

  const permit = await signPermitEIP2612(signer, tokenAddress, router.address, amount, deadline)

  const lockPermission = await signPermission('Lock', vault, signer, geyserAddress, tokenAddress, amount)

  return router.permitAndStake(geyser.address, vault.address, permit, lockPermission) as Promise<TransactionResponse>
}
