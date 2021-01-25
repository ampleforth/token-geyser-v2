import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@openzeppelin/hardhat-upgrades'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { Contract, Signer, Wallet } from 'ethers'
import { readFileSync, writeFileSync } from 'fs'
import { HardhatUserConfig, task } from 'hardhat/config'

async function deployContract(
  name: string,
  getContractFactory: Function,
  signer: Signer,
  args: Array<any> = [],
): Promise<Contract> {
  const factory = await getContractFactory(name, signer)
  const contract = await factory.deploy(...args)
  console.log('Deploying', name)
  console.log('  to', contract.address)
  console.log('  in', contract.deployTransaction.hash)
  return contract.deployed()
}

async function createInstance(
  instanceName: string,
  factory: Contract,
  getContractAt: Function,
  signer: Signer,
  args: string = '0x',
) {
  // get contract class
  const instance = await getContractAt(
    instanceName,
    await factory.connect(signer).callStatic['create(bytes)'](args),
  )
  // deploy vault
  const tx = await factory.connect(signer)['create(bytes)'](args)
  // return contract class
  console.log('Deploying', instanceName)
  console.log('  to', instance.address)
  console.log('  in', tx.hash)
  return instance
}

task('deploy', 'deploy full set of factory contracts').setAction(
  async ({}, { ethers, run, network }) => {
    await run('compile')

    const signer = Wallet.fromMnemonic(
      process.env.DEV_MNEMONIC as string,
    ).connect(ethers.provider)

    console.log('Signer', signer.address)

    const timestamp = (await signer.provider?.getBlock('latest'))?.timestamp

    const PowerSwitchFactory = await deployContract(
      'PowerSwitchFactory',
      ethers.getContractFactory,
      signer,
    )
    const RewardPoolFactory = await deployContract(
      'RewardPoolFactory',
      ethers.getContractFactory,
      signer,
    )
    const UniversalVault = await deployContract(
      'UniversalVault',
      ethers.getContractFactory,
      signer,
    )
    const VaultFactory = await deployContract(
      'VaultFactory',
      ethers.getContractFactory,
      signer,
      [UniversalVault.address],
    )

    const path = `./deployments/${network.name}/factories-${timestamp}.json`
    const latest = `./deployments/${network.name}/factories-latest.json`
    console.log('Saving config to', path)

    const blob = JSON.stringify({
      PowerSwitchFactory: PowerSwitchFactory.address,
      RewardPoolFactory: RewardPoolFactory.address,
      UniversalVault: UniversalVault.address,
      VaultFactory: VaultFactory.address,
    })

    writeFileSync(path, blob)
    writeFileSync(latest, blob)

    console.log('Verifying source on etherscan')

    await run('verify', {
      address: PowerSwitchFactory.address,
    })
    await run('verify', {
      address: RewardPoolFactory.address,
    })
    await run('verify', {
      address: UniversalVault.address,
    })
    await run('verify', {
      address: VaultFactory.address,
      constructorArguments: [UniversalVault.address],
    })
  },
)

task('create-vault', 'deploy an instance of UniversalVault')
  .addOptionalPositionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(async ({ factoryVersion }, { ethers, run, network }) => {
    await run('compile')

    const signer = Wallet.fromMnemonic(
      process.env.DEV_MNEMONIC as string,
    ).connect(ethers.provider)

    console.log('Signer', signer.address)

    const { VaultFactory } = JSON.parse(
      readFileSync(
        `./deployments/${network.name}/factories-${factoryVersion}.json`,
      ).toString(),
    )

    const vaultFactory = await ethers.getContractAt(
      'VaultFactory',
      VaultFactory,
      signer,
    )

    await createInstance(
      'UniversalVault',
      vaultFactory,
      ethers.getContractAt,
      signer,
    )
  })

task('create-geyser', 'deploy an instance of Geyser')
  .addParam('stakingToken', 'the staking token')
  .addParam('rewardToken', 'the reward token')
  .addParam('floor', 'the floor of reward scaling')
  .addParam('ceiling', 'the ceiling of reward scaling')
  .addParam('time', 'the time of reward scaling in seconds')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(
    async (
      { factoryVersion, stakingToken, rewardToken, floor, ceiling, time },
      { ethers, run, upgrades, network },
    ) => {
      await run('compile')

      const signer = Wallet.fromMnemonic(
        process.env.DEV_MNEMONIC as string,
      ).connect(ethers.provider)

      console.log('Signer', signer.address)

      const { PowerSwitchFactory, RewardPoolFactory } = JSON.parse(
        readFileSync(
          `./deployments/${network.name}/factories-${factoryVersion}.json`,
        ).toString(),
      )

      const args = [
        signer.address,
        RewardPoolFactory,
        PowerSwitchFactory,
        stakingToken,
        rewardToken,
        [floor, ceiling, time],
      ] as Array<any>

      const factory = await ethers.getContractFactory('Geyser', signer)
      const geyser = await upgrades.deployProxy(factory, args, {
        unsafeAllowCustomTypes: true,
      })

      console.log('Deploying Geyser')
      console.log('  to', geyser.address)
      console.log('  in', geyser.deployTransaction.hash)
      console.log('  staking token', stakingToken)
      console.log('  reward token', rewardToken)
      console.log('  reward floor', floor)
      console.log('  reward ceiling', ceiling)
      console.log('  reward time', stakingToken)

      // currently need to manually run verify command
      // can automate after this issue is closed: https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/290
    },
  )

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID,
      accounts: {
        mnemonic: process.env.DEV_MNEMONIC,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.4.24',
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  mocha: {
    timeout: 100000,
  },
  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: ['Mock/'],
  },
} as HardhatUserConfig
