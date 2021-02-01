import { TransactionResponse } from '@ethersproject/providers'
import { BigNumberish, Contract, Signer, Wallet } from 'ethers'
import { randomBytes } from 'ethers/lib/utils'
import { ERC20_ABI } from './abis'
import {
  isPermitable,
  loadNetworkConfig,
  signPermission,
  signPermitEIP2612,
} from './utils'

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

  const vaultFactory = new Contract(
    config.VaultFactory.address,
    config.VaultFactory.abi,
    signer,
  )

  const vaultAddress = await vaultFactory.callStatic.create()

  await vaultFactory.create()

  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  return vault
}

export const deposit = async (
  vaultAddress: string,
  tokenAddress: string,
  amount: BigNumberish,
  signer: Signer,
) => {
  const token = new Contract(tokenAddress, ERC20_ABI, signer)

  return token.transfer(vaultAddress, amount) as Promise<TransactionResponse>
}

export const stake = async (
  geyserAddress: string,
  vaultAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken

  const permission = signPermission(
    'Lock',
    vault,
    signer,
    geyser.address,
    tokenAddress,
    amount,
  )

  return geyser.stake(vault.address, amount, permission) as Promise<
    TransactionResponse
  >
}

export const unstake = async (
  geyserAddress: string,
  vaultAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const vault = new Contract(vaultAddress, config.VaultTemplate.abi, signer)

  const tokenAddress = (await geyser.getGeyserData()).stakingToken

  const permission = signPermission(
    'Unlock',
    vault,
    signer,
    geyser.address,
    tokenAddress,
    amount,
  )

  return geyser.unstake(vault.address, amount, permission) as Promise<
    TransactionResponse
  >
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

  const calldata = (
    await token.populateTransaction.transfer(recipientAddress, amount)
  ).data

  return vault.externalCall([token.address, 0, calldata]) as Promise<
    TransactionResponse
  >
}

/// Combined Actions ///

export const approveCreateDepositStake = async (
  geyserAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(
    config.RouterV1.address,
    config.RouterV1.abi,
    signer,
  )

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const token = new Contract(tokenAddress, ERC20_ABI, signer)

  const salt = randomBytes(32)
  const vaultAddress = await router.callStatic.create2Vault(
    config.VaultFactory.address,
    salt,
  )
  const vault = new Contract(vaultAddress, config.VaultTemplate.address, signer)

  const lockPermission = await signPermission(
    'Lock',
    vault,
    signer,
    geyserAddress,
    token.address,
    amount,
    0,
  )

  const args = [
    geyserAddress,
    config.VaultFactory.address,
    await signer.getAddress(),
    amount,
    salt,
    lockPermission,
  ]

  await token.approve(router.address, amount)

  return router.create2VaultAndStake(...args) as Promise<TransactionResponse>
}

export const permitCreateDepositStake = async (
  geyserAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(
    config.RouterV1.address,
    config.RouterV1.abi,
    signer,
  )

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const deadline =
    (await signer.provider.getBlock('latest')).timestamp + 60 * 60 * 24

  if (!isPermitable(tokenAddress)) {
    throw new Error(
      'Staking token not recognized as having EIP2612 permit() interface',
    )
  }

  const salt = randomBytes(32)
  const vaultAddress = await router.callStatic.create2Vault(
    config.VaultFactory.address,
    salt,
  )
  const vault = new Contract(vaultAddress, config.VaultTemplate.address, signer)

  const permit = await signPermitEIP2612(
    signer,
    tokenAddress,
    router.address,
    amount,
    deadline,
  )

  const lockPermission = await signPermission(
    'Lock',
    vault,
    signer,
    geyserAddress,
    tokenAddress,
    amount,
    0,
  )

  const args = [
    geyserAddress,
    config.VaultFactory.address,
    await signer.getAddress(),
    salt,
    permit,
    lockPermission,
  ]

  return router.create2VaultPermitAndStake(...args) as Promise<
    TransactionResponse
  >
}

export const permitDepositStake = async (
  geyserAddress: string,
  vaultAddress: string,
  amount: BigNumberish,
  signer: Wallet,
) => {
  const config = await loadNetworkConfig(signer)

  const geyser = new Contract(geyserAddress, config.GeyserTemplate.abi, signer)
  const router = new Contract(
    config.RouterV1.address,
    config.RouterV1.abi,
    signer,
  )

  const tokenAddress = (await geyser.getGeyserData()).stakingToken
  const deadline =
    (await signer.provider.getBlock('latest')).timestamp + 60 * 60 * 24

  if (!isPermitable(tokenAddress)) {
    throw new Error(
      'Staking token not recognized as having EIP2612 permit() interface',
    )
  }

  const vault = new Contract(vaultAddress, config.VaultTemplate.address, signer)

  const permit = await signPermitEIP2612(
    signer,
    tokenAddress,
    router.address,
    amount,
    deadline,
  )

  const lockPermission = await signPermission(
    'Lock',
    vault,
    signer,
    geyserAddress,
    tokenAddress,
    amount,
  )

  return router.permitAndStake(
    geyser.address,
    vault.address,
    permit,
    lockPermission,
  ) as Promise<TransactionResponse>
}
