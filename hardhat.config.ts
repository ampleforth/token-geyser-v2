import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { Contract, Signer, Wallet, BigNumber } from 'ethers'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { HardhatUserConfig, task } from 'hardhat/config'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { parseUnits } from 'ethers/lib/utils'

const SDK_PATH = './sdk'

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

async function deployMockAmpl(
  admin: SignerWithAddress,
  getContractFactory: Function,
  deployProxy: Function,
): Promise<Contract> {
  const factory = await getContractFactory('MockAmpl')
  const ampl = await deployProxy(factory, [admin.address], {
    initializer: 'initialize(address)',
  })
  await ampl.connect(admin).setMonetaryPolicy(admin.address)
  const amplInitialSupply = (await ampl.balanceOf(admin.address)) as BigNumber
  console.log('Deploying MockAmpl')
  console.log('  to', ampl.address)
  console.log('  in', ampl.deployTransaction.hash)
  console.log('Initial Ample Supply: ', amplInitialSupply.toString())
  return ampl
}

async function createInstance(
  instanceName: string,
  factory: Contract,
  getContractAt: Function,
  signer: Signer,
  args: string = '0x',
) {
  // get contract class
  const instance = await getContractAt(instanceName, await factory.connect(signer).callStatic['create(bytes)'](args))
  // deploy vault
  const tx = await factory.connect(signer)['create(bytes)'](args)
  // return contract class
  console.log('Deploying', instanceName)
  console.log('  to', instance.address)
  console.log('  in', tx.hash)
  return instance
}

task('deploy', 'deploy full set of factory contracts')
  .addFlag('noVerify')
  .addFlag('mock')
  .setAction(async ({ noVerify, mock }, { ethers, run, network, upgrades }) => {
    await run('compile')

    const signer = (await ethers.getSigners())[0]

    console.log('Signer', signer.address)

    const timestamp = (await signer.provider?.getBlock('latest'))?.timestamp

    const PowerSwitchFactory = await deployContract('PowerSwitchFactory', ethers.getContractFactory, signer)
    const RewardPoolFactory = await deployContract('RewardPoolFactory', ethers.getContractFactory, signer)
    const UniversalVault = await deployContract('UniversalVault', ethers.getContractFactory, signer)
    const VaultFactory = await deployContract('VaultFactory', ethers.getContractFactory, signer, [
      UniversalVault.address,
    ])
    const GeyserRegistry = await deployContract('GeyserRegistry', ethers.getContractFactory, signer)
    const RouterV1 = await deployContract('RouterV1', ethers.getContractFactory, signer)

    if (mock) {
      const totalSupply = parseUnits('10')
      await deployContract('MockERC20', ethers.getContractFactory, signer, [signer.address, totalSupply])
      await deployContract('MockBAL', ethers.getContractFactory, signer, [signer.address, totalSupply])
      await deployMockAmpl(signer, ethers.getContractFactory, upgrades.deployProxy)
    }

    console.log('Locking template')

    await UniversalVault.initializeLock()

    const path = `${SDK_PATH}/deployments/${network.name}/`
    const file = `factories-${timestamp}.json`
    const latest = `factories-latest.json`

    console.log('Saving config to', path + file)

    const blob = JSON.stringify({
      PowerSwitchFactory: {
        address: PowerSwitchFactory.address,
        abi: PowerSwitchFactory.interface.format(),
      },
      RewardPoolFactory: {
        address: RewardPoolFactory.address,
        abi: RewardPoolFactory.interface.format(),
      },
      VaultTemplate: {
        address: UniversalVault.address,
        abi: UniversalVault.interface.format(),
      },
      VaultFactory: {
        address: VaultFactory.address,
        abi: VaultFactory.interface.format(),
      },
      GeyserRegistry: {
        address: GeyserRegistry.address,
        abi: GeyserRegistry.interface.format(),
      },
      GeyserTemplate: {
        abi: (await ethers.getContractAt('Geyser', ethers.constants.AddressZero)).interface.format(),
      },
      RouterV1: {
        address: RouterV1.address,
        abi: RouterV1.interface.format(),
      },
    })

    mkdirSync(path, { recursive: true })
    writeFileSync(path + file, blob)
    writeFileSync(path + latest, blob)

    if (!noVerify) {
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
      await run('verify', {
        address: GeyserRegistry.address,
      })
    }
  })

task('create-vault', 'deploy an instance of UniversalVault')
  .addOptionalPositionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(async ({ factoryVersion }, { ethers, run, network }) => {
    await run('compile')

    const signer = (await ethers.getSigners())[0]

    console.log('Signer', signer.address)

    const { VaultFactory } = JSON.parse(
      readFileSync(`${SDK_PATH}/deployments/${network.name}/factories-${factoryVersion}.json`).toString(),
    )

    const vaultFactory = await ethers.getContractAt('VaultFactory', VaultFactory.address, signer)

    await createInstance('UniversalVault', vaultFactory, ethers.getContractAt, signer)
  })

task('create-geyser', 'deploy an instance of Geyser')
  .addParam('stakingToken', 'the staking token')
  .addParam('rewardToken', 'the reward token')
  .addParam('floor', 'the floor of reward scaling')
  .addParam('ceiling', 'the ceiling of reward scaling')
  .addParam('time', 'the time of reward scaling in seconds')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(
    async ({ factoryVersion, stakingToken, rewardToken, floor, ceiling, time }, { ethers, run, upgrades, network }) => {
      await run('compile')

      const signer = (await ethers.getSigners())[0]

      console.log('Signer', signer.address)

      const { PowerSwitchFactory, RewardPoolFactory, VaultFactory, GeyserRegistry } = JSON.parse(
        readFileSync(`${SDK_PATH}/deployments/${network.name}/factories-${factoryVersion}.json`).toString(),
      )

      const factory = await ethers.getContractFactory('Geyser', signer)
      const geyser = await upgrades.deployProxy(factory, undefined, {
        initializer: false,
      })

      console.log('Deploying Geyser')
      console.log('  to', geyser.address)
      console.log('  in', geyser.deployTransaction.hash)
      console.log('  staking token', stakingToken)
      console.log('  reward token', rewardToken)
      console.log('  reward floor', floor)
      console.log('  reward ceiling', ceiling)
      console.log('  reward time', stakingToken)

      console.log('Register Geyser Instance')

      const geyserRegistry = await ethers.getContractAt('GeyserRegistry', GeyserRegistry.address, signer)

      await geyserRegistry.register(geyser.address)

      await geyser.initialize(
        signer.address,
        RewardPoolFactory.address,
        PowerSwitchFactory.address,
        stakingToken,
        rewardToken,
        [floor, ceiling, time],
      )
      console.log('Register Vault Factory')

      await geyser.registerVaultFactory(VaultFactory.address)
    },
  )

task('fund-geyser', 'fund an instance of Geyser')
  .addParam('geyser', 'address of geyser')
  .addParam('amount', 'amount')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(async ({ geyser, amount }, { ethers }) => {
    const signer = (await ethers.getSigners())[0]
    const geyserContract = await ethers.getContractAt('Geyser', geyser, signer)
    const data = await geyserContract.getGeyserData()
    const { rewardToken: rewardTokenAddress } = data
    const rewardToken = await ethers.getContractAt('MockAmpl', rewardTokenAddress, signer)
    const amt = parseUnits(amount, 9)
    await rewardToken.approve(geyser, amt)
    await geyserContract.connect(signer).fundGeyser(amt, 10000)
  })

// currently need to manually run verify command
// can automate after this issue is closed: https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/290
task('verify-geyser', 'verify and lock the Geyser template')
  .addPositionalParam('geyserTemplate', 'the geyser template address')
  .setAction(async ({ geyserTemplate }, { ethers, run, upgrades, network }) => {
    await run('compile')

    const signer = (await ethers.getSigners())[0]

    console.log('Signer', signer.address)

    const contract = await ethers.getContractAt('Geyser', geyserTemplate, signer)

    console.log('Locking template')

    await contract.initializeLock()

    console.log('Verifying source on etherscan')

    await run('verify', {
      address: contract.address,
    })
  })

// When using a local network, MetaMask assumes a chainId of 1337, even though the default chainId of HardHat is 31337
// https://github.com/MetaMask/metamask-extension/issues/10290
export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      chainId: 1337,
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID,
      accounts: {
        mnemonic: process.env.DEV_MNEMONIC || Wallet.createRandom().mnemonic.phrase,
      },
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/' + process.env.INFURA_ID,
      accounts: {
        mnemonic: process.env.DEV_MNEMONIC || Wallet.createRandom().mnemonic.phrase,
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
