import { ethers } from 'hardhat'
import { expect } from 'chai'
import { Signer, Contract, BigNumber } from 'ethers'

describe('CharmGeyserRouter', function () {
  let deployer: Signer
  let user: Signer
  let vaultOwner: Signer
  let token0: Contract
  let token1: Contract
  let charmLiqToken: Contract
  let geyser: Contract
  let vaultFactory: Contract
  let router: Contract

  beforeEach(async () => {
    ;[deployer, user, vaultOwner] = await ethers.getSigners()

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    token0 = await MockERC20.connect(deployer).deploy(await user.getAddress(), ethers.utils.parseEther('1000000'))
    token1 = await MockERC20.connect(deployer).deploy(await user.getAddress(), ethers.utils.parseEther('1000000'))
    await token0.deployed()
    await token1.deployed()

    // Deploy mock Charm LP Token
    const MockCharmLiqToken = await ethers.getContractFactory('MockCharmLiqToken')
    charmLiqToken = await MockCharmLiqToken.deploy(token0.address, token1.address)
    await charmLiqToken.deployed()

    // Deploy mock Geyser
    const MockGeyser = await ethers.getContractFactory('MockGeyser')
    geyser = await MockGeyser.deploy(charmLiqToken.address)
    await geyser.deployed()

    // Deploy mock Vault Factory
    const MockVaultFactory = await ethers.getContractFactory('MockVaultFactory')
    vaultFactory = await MockVaultFactory.deploy()
    await vaultFactory.deployed()

    // Deploy CharmGeyserRouter
    const CharmGeyserRouter = await ethers.getContractFactory('CharmGeyserRouter')
    router = await CharmGeyserRouter.deploy()
    await router.deployed()
  })

  describe('createLiqAndStake', function () {
    it('should create liquidity and stake correctly', async () => {
      const token0Amount = ethers.utils.parseEther('100')
      const token1Amount = ethers.utils.parseEther('200')

      await token0.connect(user).approve(router.address, token0Amount)
      await token1.connect(user).approve(router.address, token1Amount)
      const userInitialBal0: BigNumber = await token0.balanceOf(await user.getAddress())
      const userInitialBal1: BigNumber = await token1.balanceOf(await user.getAddress())

      // dummy vault address
      const vault = ethers.Wallet.createRandom().address

      const liqPayload = {
        token0Amt: token0Amount,
        token1Amt: token1Amount,
        token0MinAmt: ethers.utils.parseEther('90'),
        token1MinAmt: ethers.utils.parseEther('180'),
      }

      await expect(router.connect(user).createLiqAndStake(geyser.address, vault, '0x', liqPayload))
        .to.emit(geyser, 'Staked')
        .withArgs(vault, token0Amount.add(token1Amount), '0x')

      // After staking, router should have transferred all tokens out
      expect(await token0.balanceOf(router.address)).to.equal(0)
      expect(await token1.balanceOf(router.address)).to.equal(0)

      const userFinalBal0 = await token0.balanceOf(await user.getAddress())
      const userFinalBal1 = await token1.balanceOf(await user.getAddress())
      expect(userInitialBal0.sub(userFinalBal0)).to.equal(token0Amount)
      expect(userInitialBal1.sub(userFinalBal1)).to.equal(token1Amount)
    })
  })

  describe('create2VaultCreateLiqAndStake', function () {
    it('should create a vault, transfer ownership, create liquidity and stake', async () => {
      const token0Amount = ethers.utils.parseEther('50')
      const token1Amount = ethers.utils.parseEther('100')

      await token0.connect(user).approve(router.address, token0Amount)
      await token1.connect(user).approve(router.address, token1Amount)

      const liqPayload = {
        token0Amt: token0Amount,
        token1Amt: token1Amount,
        token0MinAmt: ethers.utils.parseEther('40'),
        token1MinAmt: ethers.utils.parseEther('80'),
      }

      const salt = ethers.utils.formatBytes32String('testSalt')
      const args = [geyser.address, vaultFactory.address, await vaultOwner.getAddress(), salt, '0x', liqPayload]
      const vault = await router.connect(user).callStatic.create2VaultCreateLiqAndStake(...args)
      await expect(router.connect(user).create2VaultCreateLiqAndStake(...args))
        .to.emit(geyser, 'Staked')
        .withArgs(vault, token0Amount.add(token1Amount), '0x')
      expect(await vaultFactory.ownerOf(1)).to.equal(await vaultOwner.getAddress())
    })
  })

  describe('Approvals', function () {
    it('should approve max if current allowance is insufficient', async () => {
      const token0Amount = ethers.utils.parseEther('10')
      const token1Amount = ethers.utils.parseEther('20')
      await token0.connect(user).approve(router.address, token0Amount)
      await token1.connect(user).approve(router.address, token1Amount)

      const vault = ethers.Wallet.createRandom().address

      const liqPayload = {
        token0Amt: token0Amount,
        token1Amt: token1Amount,
        token0MinAmt: ethers.utils.parseEther('9'),
        token1MinAmt: ethers.utils.parseEther('18'),
      }

      expect(await token0.allowance(router.address, charmLiqToken.address)).to.equal(0)
      expect(await token1.allowance(router.address, charmLiqToken.address)).to.equal(0)

      await router.connect(user).createLiqAndStake(geyser.address, vault, '0x', liqPayload)

      const maxUint = ethers.constants.MaxUint256
      expect(await token0.allowance(router.address, charmLiqToken.address)).to.equal(maxUint.sub(liqPayload.token0Amt))
      expect(await token1.allowance(router.address, charmLiqToken.address)).to.equal(maxUint.sub(liqPayload.token1Amt))
    })
  })

  describe('Edge cases', function () {
    it('should handle zero amounts gracefully', async () => {
      await token0.connect(user).approve(router.address, 0)
      await token1.connect(user).approve(router.address, 0)

      const vault = ethers.Wallet.createRandom().address
      const liqPayload = {
        token0Amt: 0,
        token1Amt: 0,
        token0MinAmt: 0,
        token1MinAmt: 0,
      }

      await expect(router.connect(user).createLiqAndStake(geyser.address, vault, '0x', liqPayload))
        .to.emit(geyser, 'Staked')
        .withArgs(vault, 0, '0x')
    })
  })
})
