import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-verify'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import { getAdminAddress, getImplementationAddress } from '@openzeppelin/upgrades-core'

import { Contract, Signer, Wallet, BigNumber } from 'ethers'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { HardhatUserConfig, task } from 'hardhat/config'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { BytesLike, parseUnits } from 'ethers/lib/utils'
import { HttpNetworkUserConfig } from 'hardhat/types'
import { impersonateAccount, setBalance } from '@nomicfoundation/hardhat-network-helpers'

import { signPermission } from './frontend/src/sdk/utils'

const SDK_PATH = './sdk'

// Loads env variables from .env file
import * as dotenv from 'dotenv'
dotenv.config()

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
  .addFlag('mock')
  .setAction(async ({ mock }, { ethers, run, network, upgrades }) => {
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

    // // Used to recover from fail deploy
    // const PowerSwitchFactory = await ethers.getContractAt(
    //   'PowerSwitchFactory',
    //   '0x510393Bac3905781086CdfA879d4cBF4F7901629',
    //   signer,
    // )
    // const RewardPoolFactory = await ethers.getContractAt(
    //   'RewardPoolFactory',
    //   '0x6aE1d838327499fD42A708F1CeA8CE3b8D7975e4',
    //   signer,
    // )
    // const UniversalVault = await ethers.getContractAt(
    //   'UniversalVault',
    //   '0x5C8884839B77383154E732021580F82F41998Fa6',
    //   signer,
    // )
    // const VaultFactory = await ethers.getContractAt(
    //   'VaultFactory',
    //   '0x9E1fbFEf5508eCB4A45632CE638A44a160E4979D',
    //   signer,
    // )
    // const GeyserRegistry = await ethers.getContractAt(
    //   'GeyserRegistry',
    //   '0xC4AB03ee92f0e08211b55015b6aCA64CbaEbA382',
    //   signer,
    // )
    // const RouterV1 = await ethers.getContractAt('RouterV1', '0xb21bEF79929Fa34F75f81e866a13714DE473ffe2', signer)

    console.log('Locking template')

    let nonce = await signer.getTransactionCount()
    if (network.name === 'base-goerli') {
      nonce = nonce + 1
    }

    await UniversalVault.initializeLock({ nonce: nonce })

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
  })

task('verify-factories', 'verfires the deployed factories')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(async ({ factoryVersion }, { ethers, run, network }) => {
    const { PowerSwitchFactory, RewardPoolFactory, VaultFactory, GeyserRegistry, VaultTemplate } = JSON.parse(
      readFileSync(`${SDK_PATH}/deployments/${network.name}/factories-${factoryVersion}.json`).toString(),
    )

    console.log('Verifying source on etherscan')
    try {
      await run('verify:verify', {
        address: PowerSwitchFactory.address,
      })
    } catch (e) {}
    try {
      await run('verify:verify', {
        address: RewardPoolFactory.address,
      })
    } catch (e) {}
    try {
      await run('verify:verify', {
        address: VaultTemplate.address,
      })
    } catch (e) {}
    try {
      await run('verify:verify', {
        address: VaultFactory.address,
        constructorArguments: [VaultTemplate.address],
      })
    } catch (e) {}
    try {
      await run('verify:verify', {
        address: GeyserRegistry.address,
      })
    } catch (e) {}
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

task('mint-erc20-token', 'mints token impersonating the owner')
  .addParam('token', 'the token to mint')
  .addParam('admin', 'the admin to impersonate')
  .addParam('destination', 'the address to fund')
  .addParam('amount', 'scaled in decimals')
  .setAction(async ({ token, destination, admin, amount }, { ethers, run, network }) => {
    const accounts = await ethers.getSigners()
    const signer = accounts[0]

    const tokenContractMint = await ethers.getContractAt(
      ['function mint(address account, uint256 amount) external'],
      token,
      signer,
    )
    const tokenContract = await ethers.getContractAt('ERC20', token, signer)

    const config = network.config as HttpNetworkUserConfig

    if (network.name && network.name.toLowerCase() === 'tenderly') {
      if (config.url !== undefined) {
        ethers.provider = new ethers.providers.JsonRpcProvider(config.url)
      }

      const balanceAccounts = accounts.map((a) => a.address)
      balanceAccounts.push(admin)
      await ethers.provider.send('tenderly_setBalance', [
        balanceAccounts,
        ethers.utils.hexValue(ethers.utils.parseUnits('10', 'ether').toHexString()),
      ])
    } else {
      await impersonateAccount(admin)
      await setBalance(admin, ethers.utils.parseEther('100'))
    }

    const adminSigner = ethers.provider.getSigner(admin)

    const decimals = await tokenContract.decimals()
    console.log('decimals', decimals)
    const finalAmount = ethers.utils.parseUnits(amount, decimals)
    await tokenContractMint.connect(adminSigner).mint(destination, finalAmount)
  })

task('mint-reward-token', 'mints reward token (non-transferrable) impersonating the owner')
  .addParam('token', 'the token to mint')
  .addParam('admin', 'the admin to impersonate')
  .addParam('destination', 'the address to fund')
  .addParam('amount', 'scaled in decimals')
  .setAction(async ({ token, destination, admin, amount }, { ethers, run, network }) => {
    const accounts = await ethers.getSigners()
    const signer = accounts[0]

    const rewardTokenContractAccess = await ethers.getContractAt(
      [
        'function hasRole(bytes32 role, address account) public view returns (bool)',
        'function MINTER_ROLE() public pure returns (bytes32)',
        'function mint(address account, uint256 amount) external',
      ],
      token,
      signer,
    )

    const rewardTokenContract = await ethers.getContractAt('ERC20', token, signer)
    const mintRole = await rewardTokenContractAccess.MINTER_ROLE()
    const hasMintRole = await rewardTokenContractAccess.hasRole(mintRole, admin)
    if (!hasMintRole) {
      console.log('Not an admin.')
    }

    const config = network.config as HttpNetworkUserConfig

    if (network.name && network.name.toLowerCase() === 'tenderly') {
      if (config.url !== undefined) {
        ethers.provider = new ethers.providers.JsonRpcProvider(config.url)
      }

      const balanceAccounts = accounts.map((a) => a.address)
      balanceAccounts.push(admin)
      await ethers.provider.send('tenderly_setBalance', [
        balanceAccounts,
        ethers.utils.hexValue(ethers.utils.parseUnits('10', 'ether').toHexString()),
      ])
    } else {
      await impersonateAccount(admin)
      await setBalance(admin, ethers.utils.parseEther('100'))
    }

    const adminSigner = ethers.provider.getSigner(admin)

    const decimals = await rewardTokenContract.decimals()
    const finalAmount = ethers.utils.parseUnits(amount, decimals)
    await rewardTokenContractAccess.connect(adminSigner).mint(destination, finalAmount)
  })

task('check-balance', 'checks balance of minted token')
  .addParam('token', 'the token to mint')
  .setAction(async ({ token }, { ethers, run, network }) => {
    const accounts = await ethers.getSigners()
    const signer = accounts[0]

    const tokenContract = await ethers.getContractAt('ERC20', token, signer)

    const balance = await tokenContract.balanceOf(signer.address)
    console.log(`${signer.address} has a balance of: ${balance}`)
  })

task('allow-transfer', 'allows transfer of token')
  .addParam('token', 'the toke to mint')
  .addParam('admin', 'admin')
  .addParam('target', 'address to allow')
  .setAction(async ({ token, admin, target }, { ethers, run, network }) => {
    const accounts = await ethers.getSigners()
    const signer = accounts[0]

    const rewardTokenContractAccess = await ethers.getContractAt(
      [
        'function hasRole(bytes32 role, address account) public view returns (bool)',
        'function TRANSFER_ROLE() public pure returns (bytes32)',
        'function grantRole(bytes32 role, address account) public',
      ],
      token,
      signer,
    )
    const transferRole = await rewardTokenContractAccess.TRANSFER_ROLE()
    const hasTransferRole = await rewardTokenContractAccess.hasRole(transferRole, target)
    if (!hasTransferRole) {
      const config = network.config as HttpNetworkUserConfig

      if (network.name && network.name.toLowerCase() === 'tenderly') {
        if (config.url !== undefined) {
          ethers.provider = new ethers.providers.JsonRpcProvider(config.url)
        }

        const balanceAccounts = accounts.map((a) => a.address)
        balanceAccounts.push(admin)
        await ethers.provider.send('tenderly_setBalance', [
          balanceAccounts,
          ethers.utils.hexValue(ethers.utils.parseUnits('10', 'ether').toHexString()),
        ])
      } else {
        await impersonateAccount(admin)
        await setBalance(admin, ethers.utils.parseEther('100'))
      }

      const adminSigner = ethers.provider.getSigner(admin)
      await rewardTokenContractAccess.connect(adminSigner).grantRole(transferRole, target)
      console.log(`Granted transfer role to ${target}`)
    } else {
      console.log('Already has transfer role')
    }
  })

task('create-geyser', 'deploy an instance of Geyser')
  .addParam('stakingtoken', 'the staking token')
  .addParam('rewardtoken', 'the reward token')
  .addParam('floor', 'the floor of reward scaling')
  .addParam('ceiling', 'the ceiling of reward scaling')
  .addParam('time', 'the time of reward scaling in seconds')
  .addOptionalParam('finalowner', 'the address of the final owner', '0x')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(
    async (
      { factoryVersion, stakingtoken, rewardtoken, floor, ceiling, time, finalowner },
      { ethers, run, upgrades, network },
    ) => {
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
      await geyser.deployTransaction.wait(1)
      const implementation = await getImplementationAddress(ethers.provider, geyser.address)
      const proxyAdminAddress = await getAdminAddress(ethers.provider, geyser.address)
      console.log('Deploying Geyser')
      console.log('  to proxy', geyser.address)
      console.log('  to implementation', implementation)
      console.log('  with upgreadability admin', proxyAdminAddress)
      console.log('  in', geyser.deployTransaction.hash)
      console.log('  staking token', stakingtoken)
      console.log('  reward token', rewardtoken)
      console.log('  reward floor', floor)
      console.log('  reward ceiling', ceiling)

      // CRITICAL: The ordering of the following transaction can't change for the subgraph to be indexed

      // Note: geyser registry is owned by the ecofund multisig
      // this script will fail here
      // the following need to be executed manually
      console.log('Register Geyser Instance')
      const geyserRegistry = await ethers.getContractAt('GeyserRegistry', GeyserRegistry.address, signer)
      await (await geyserRegistry.register(geyser.address)).wait(1)

      console.log('initialize geyser')
      await (
        await geyser.initialize(
          signer.address,
          RewardPoolFactory.address,
          PowerSwitchFactory.address,
          stakingtoken,
          rewardtoken,
          [floor, ceiling, time],
        )
      ).wait(1)

      console.log('Register Vault Factory')
      await (await geyser.registerVaultFactory(VaultFactory.address)).wait(1)

      if (finalowner !== '0x') {
        console.log('Transfer ownership')
        const powerSwitch = await ethers.getContractAt(
          '@openzeppelin/contracts/access/Ownable.sol:Ownable',
          await geyser.getPowerSwitch(),
        )
        const proxyAdmin = await ethers.getContractAt(
          '@openzeppelin/contracts/access/Ownable.sol:Ownable',
          proxyAdminAddress,
        )
        await (await powerSwitch.transferOwnership(finalowner)).wait(1)
        await (await geyser.transferOwnership(finalowner)).wait(1)
        await (await proxyAdmin.transferOwnership(finalowner)).wait(1)
      }
    },
  )

task('get-owners', 'gets the owner of the given contract')
  .addParam('geyser', 'address of geyser')
  .addParam('proxyadmin', 'address of geyser')
  .setAction(async ({ geyser, proxyadmin }, { ethers, run, upgrades, network }) => {
    const signer = (await ethers.getSigners())[0]
    const geyserContract = await ethers.getContractAt('Geyser', geyser, signer)

    const powerSwitch = await ethers.getContractAt(
      '@openzeppelin/contracts/access/Ownable.sol:Ownable',
      await geyserContract.getPowerSwitch(),
    )
    const proxyAdmin = await ethers.getContractAt(
      '@openzeppelin/contracts/access/Ownable.sol:Ownable',
      proxyadmin,
    )

    const powerSwitchOwner = await powerSwitch.owner()
    console.log(`powerSwitchOwner: ${powerSwitchOwner}`)
    const geyserOwner = await geyserContract.owner()
    console.log(`geyserOwner: ${geyserOwner}`)
    const proxyAdminOwner = await proxyAdmin.owner()
    console.log(`proxyAdminOwner: ${proxyAdminOwner}`)
  })

task('fund-geyser', 'fund an instance of Geyser')
  .addParam('geyser', 'address of geyser')
  .addParam('amount', 'amount in floating point')
  .addParam('decimals', 'decimals of reward/funding token')
  .addParam('duration', 'time in seconds the program lasts')
  .addOptionalParam('factoryVersion', 'the factory version', 'latest')
  .setAction(async ({ geyser, amount, decimals, duration }, { ethers, network }) => {
    const signer = (await ethers.getSigners())[0]
    const geyserContract = await ethers.getContractAt('Geyser', geyser, signer)
    const data = await geyserContract.getGeyserData()
    const { rewardToken: rewardTokenAddress } = data
    const rewardToken = await ethers.getContractAt('MockAmpl', rewardTokenAddress, signer)
    const amt = parseUnits(amount, decimals)
    await rewardToken.approve(geyser, amt)
    console.log(`Funding Geyser with amount: ${amt}`)

    let nonce = await signer.getTransactionCount()
    if (network.name === 'base-goerli') {
      nonce = nonce + 1
    }

    await geyserContract.connect(signer).fundGeyser(amt, duration)
  })

task('wrap-and-stake', 'fund an instance of Geyser')
  .addParam('unbutton', 'address of ub contract')
  .addParam('geyser', 'address of geyser')
  .addParam('vault', 'address of universal vault')
  .addParam('amount', 'amount in raw decimals')
  .setAction(async ({ unbutton, geyser, vault, amount }, { ethers, network }) => {
    if (network.name && network.name.toLowerCase() !== 'tenderly') {
      console.log('not on tenderly')
      return
    }

    const signer = (await ethers.getSigners())[0]

    const wallet = new ethers.Wallet(process.env.BASE_TESTNET_PRIVATE_KEY as BytesLike, ethers.provider)

    const unbuttonContract = await ethers.getContractAt(
      [
        'function underlying() external view returns (address)',
        'function deposit(uint256 uAmount) external returns (uint256)',
        'function withdraw(uint256 uAmount) external returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
      ],
      unbutton,
      signer,
    )

    const underlying = await unbuttonContract.connect(signer).underlying()
    console.log(`Unbutton Underlying: ${underlying}`)

    const underlyingContract = await ethers.getContractAt(
      [
        'function balanceOf(address account) external view returns (uint256)',
        'function approve(address spender, uint256 value) external returns (bool)',
      ],
      underlying,
      signer,
    )
    const underlyingBalance = await underlyingContract.balanceOf(signer.address)
    console.log(`Underlying balance: ${underlyingBalance}`)

    await underlyingContract.approve(unbuttonContract.address, amount)
    await unbuttonContract.connect(signer).deposit(amount)

    const geyserUbBalanceBefore = await unbuttonContract.balanceOf(geyser)
    console.log(`Geyser Unbuttoned balance before: ${geyserUbBalanceBefore}`)

    const geyserContract = await ethers.getContractAt('Geyser', geyser, signer)
    const vaultContract = await ethers.getContractAt('UniversalVault', vault, signer)

    const permission = await signPermission(
      'Lock',
      vaultContract,
      wallet,
      geyserContract.address,
      unbuttonContract.address,
      amount,
    )
    // fails here: permission string is returned (follows front end logic)
    await geyserContract.stake(vaultContract.address, ethers.BigNumber.from(amount), permission)

    const geyserUbBalanceAfter = await unbuttonContract.balanceOf(geyser)
    console.log(`Geyser Unbuttoned balance after: ${geyserUbBalanceAfter}`)
  })

// currently need to manually run verify command
// ie) the implementation address of the deployed proxy through create-geyser
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

    await run('verify:verify', {
      address: contract.address,
    })

    // TODO: verify reward pool
  })

task('lookup-proxy-admin', 'gets the proxy admin of the given contract')
  .addPositionalParam('address', 'the proxy contract address')
  .setAction(async ({ address }, { ethers, run, upgrades, network }) => {
    console.log('Proxy Admin:', await getAdminAddress(ethers.provider, address))
  })

const getScanAPIKey = () => {
  switch (process.env.HARDHAT_NETWORK) {
    case 'mainnet' || 'kovan' || 'goerli':
      return process.env.ETHERSCAN_API_KEY
    case 'avalanche' || 'avalanche_fiji':
      return process.env.SNOWTRACE_API_KEY
    case 'base-mainnet' || 'base-goerli':
      return process.env.BASESCAN_API_KEY
    default:
      return ''
  }
}

// When using a local network, MetaMask assumes a chainId of 1337, even though the default chainId of HardHat is 31337
// https://github.com/MetaMask/metamask-extension/issues/10290
export default {
  networks: {
    localhost: {
      forking: {
        url: `https://base.gateway.tenderly.co/${process.env.TENDERLY_PROJECT_ID}`,
        enabled: true,
      },
    },
    hardhat: {
      forking: {
        url: `https://base.gateway.tenderly.co/${process.env.TENDERLY_PROJECT_ID}`,
        enabled: true,
      },
      allowUnlimitedContractSize: true,
      chainId: 1337,
    },
    ganache: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_SECRET}`,
      accounts: {
        mnemonic: process.env.PROD_MNEMONIC || Wallet.createRandom().mnemonic.phrase,
      },
      gasMultiplier: 1.03,
      allowUnlimitedContractSize: true,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_SECRET}`,
      accounts: {
        mnemonic: process.env.PROD_MNEMONIC || Wallet.createRandom().mnemonic.phrase,
      },
      gasMultiplier: 1.03,
    },
    tenderly: {
      chainId: 3030, // using same avee deploy chainId on tenderly
      url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID}`,
      accounts: [(process.env.BASE_TESTNET_PRIVATE_KEY as string) ?? 'BASE_TESTNET_PRIVATE_KEY'],
    },
    'base-mainnet': {
      url: 'https://rpc.ankr.com/base',
      accounts: [(process.env.BASE_PROD_PRIVATE_KEY as string) ?? 'BASE_PROD_PRIVATE_KEY'],
      gasPrice: 1000000000,
    },
    'base-goerli': {
      url: 'https://rpc.ankr.com/base_goerli',
      accounts: [(process.env.BASE_TESTNET_PRIVATE_KEY as string) ?? 'BASE_TESTNET_PRIVATE_KEY'],
      gasPrice: 1000000000,
      gasMultiplier: 1.1,
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
    apiKey: {
      'base-mainnet': (process.env.BASESCAN_API_KEY as string) ?? 'BASESCAN_API_KEY',
      'base-goerli': "don't need one",
    },
    customChains: [
      {
        network: 'base-mainnet',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'base-goerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org',
        },
      },
    ],
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
