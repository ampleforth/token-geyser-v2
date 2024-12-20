import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer, Contract, BigNumber } from 'ethers'

describe('GeyserRouter', function () {
  let deployer: Signer
  let user: Signer
  let vaultOwner: Signer
  let router: Contract
  let geyser: Contract
  let factory: Contract
  let stakingToken: Contract
  let vaultAddress: string
  let vaultNFTId: BigNumber

  beforeEach(async () => {
    ;[deployer, user, vaultOwner] = await ethers.getSigners()

    // Mock ERC20 token
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    stakingToken = await MockERC20.deploy(await user.getAddress(), ethers.utils.parseEther('1000000'))
    await stakingToken.deployed()

    // Mock Geyser
    const MockGeyser = await ethers.getContractFactory('MockGeyser')
    geyser = await MockGeyser.deploy(stakingToken.address)
    await geyser.deployed()

    // Mock Factory (ERC721-based)
    const MockVaultFactory = await ethers.getContractFactory('MockVaultFactory')
    factory = await MockVaultFactory.deploy()
    await factory.deployed()

    // Deploy Router
    const GeyserRouter = await ethers.getContractFactory('GeyserRouter')
    router = await GeyserRouter.deploy()
    await router.deployed()
  })

  describe('create2Vault', () => {
    it('should create a vault using create2', async () => {
      const salt = ethers.utils.formatBytes32String('testSalt')

      vaultAddress = await router.callStatic.create2Vault(factory.address, salt, await vaultOwner.getAddress())
      expect(vaultAddress).to.not.be.undefined

      // The factory should have minted an NFT representing the vault to the vault owner
      await router.create2Vault(factory.address, salt, await vaultOwner.getAddress())
      expect(await factory.balanceOf(await vaultOwner.getAddress())).to.equal(1)
    })
  })

  describe('depositStake', () => {
    beforeEach(async () => {
      // create a vault
      const salt = ethers.utils.formatBytes32String('testSalt2')
      vaultAddress = await router.callStatic.create2Vault(factory.address, salt, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt, await vaultOwner.getAddress())
    })

    it('should deposit stake tokens from user into vault and call stake on geyser', async () => {
      const amount = ethers.utils.parseEther('100')
      await stakingToken.connect(user).approve(router.address, amount)

      await expect(router.connect(user).depositStake(geyser.address, vaultAddress, amount, '0x'))
        .to.emit(geyser, 'Staked')
        .withArgs(vaultAddress, amount, '0x')

      // Check vault (just ensure tokens moved)
      expect(await stakingToken.balanceOf(vaultAddress)).to.equal(amount)
    })
  })

  describe('create2VaultAndStake', () => {
    it('should create a vault, transfer ownership, and stake tokens', async () => {
      const amount = ethers.utils.parseEther('50')
      await stakingToken.connect(user).approve(router.address, amount)
      const salt = ethers.utils.formatBytes32String('testSalt3')

      const args = [geyser.address, factory.address, await vaultOwner.getAddress(), amount, salt, '0x']

      const vaultAddr = await router.connect(user).callStatic.create2VaultAndStake(...args)

      await expect(router.connect(user).create2VaultAndStake(...args))
        .to.emit(geyser, 'Staked')
        .withArgs(vaultAddr, amount, '0x')

      // vaultOwner should now own the vault NFT
      expect(await factory.ownerOf(1)).to.equal(await vaultOwner.getAddress())
    })
  })

  describe('create2VaultPermitAndStake', () => {
    it('should create vault, transfer ownership, permit, and stake', async () => {
      const amount = ethers.utils.parseEther('200')
      const salt = ethers.utils.formatBytes32String('testSalt4')

      // Mock permit data. In practice, you'd generate a signature off-chain.
      // Here, we simply assume the mock ERC20 supports permit or is a mock that doesn't revert.
      const deadline = Math.floor(Date.now() / 1000) + 3600
      const owner = await user.getAddress()
      const spender = await user.getAddress()
      const value = amount

      // Normally you'd produce a real permit signature. For testing we assume mock token doesn't revert.
      const v = 27
      const r = ethers.utils.formatBytes32String('r')
      const s = ethers.utils.formatBytes32String('s')

      const permit = {
        owner,
        spender,
        value,
        deadline,
        v,
        r,
        s,
      }

      // user must have tokens
      await stakingToken.connect(user).approve(router.address, amount)

      const args = [geyser.address, factory.address, await vaultOwner.getAddress(), salt, permit, '0x']
      const vaultAddr = await router.connect(user).callStatic.create2VaultPermitAndStake(...args)

      await expect(router.connect(user).create2VaultPermitAndStake(...args))
        .to.emit(geyser, 'Staked')
        .withArgs(vaultAddr, amount, '0x')
      expect(await factory.ownerOf(1)).to.equal(await vaultOwner.getAddress())
    })
  })

  describe('stakeMulti', () => {
    it('should call stake on multiple geysers', async () => {
      // create vaults for multiple requests
      const salt1 = ethers.utils.formatBytes32String('multi1')
      const salt2 = ethers.utils.formatBytes32String('multi2')
      const vault1 = await router.callStatic.create2Vault(factory.address, salt1, await vaultOwner.getAddress())
      const vault2 = await router.callStatic.create2Vault(factory.address, salt2, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt1, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt2, await vaultOwner.getAddress())

      const amount1 = ethers.utils.parseEther('10')
      const amount2 = ethers.utils.parseEther('20')

      const requests = [
        {
          geyser: geyser.address,
          vault: vault1,
          amount: amount1,
          permission: '0x',
        },
        {
          geyser: geyser.address,
          vault: vault2,
          amount: amount2,
          permission: '0x',
        },
      ]

      // In a real scenario, you'd need to ensure the vaults have tokens staked beforehand or
      // the geyser allows calling `stake` from the router address. For simplicity, we rely on mock logic.

      await expect(router.stakeMulti(requests))
        .to.emit(geyser, 'Staked')
        .withArgs(vault1, amount1, '0x')
        .and.to.emit(geyser, 'Staked')
        .withArgs(vault2, amount2, '0x')
    })
  })

  describe('unstakeMulti', () => {
    it('should call unstakeAndClaim on multiple geysers', async () => {
      const salt = ethers.utils.formatBytes32String('unstakeTest')
      const vault = await router.callStatic.create2Vault(factory.address, salt, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt, await vaultOwner.getAddress())

      const amount = ethers.utils.parseEther('5')
      const requests = [
        {
          geyser: geyser.address,
          vault: vault,
          amount: amount,
          permission: '0x',
        },
      ]

      await expect(router.unstakeMulti(requests)).to.emit(geyser, 'UnstakedAndClaimed').withArgs(vault, amount, '0x')
    })
  })

  describe('unstakeAndRestake', () => {
    it('should call stake on first geyser request and unstakeAndClaim on second geyser request', async () => {
      const salt1 = ethers.utils.formatBytes32String('r1')
      const salt2 = ethers.utils.formatBytes32String('r2')
      const vault1 = await router.callStatic.create2Vault(factory.address, salt1, await vaultOwner.getAddress())
      const vault2 = await router.callStatic.create2Vault(factory.address, salt2, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt1, await vaultOwner.getAddress())
      await router.create2Vault(factory.address, salt2, await vaultOwner.getAddress())

      const amount1 = ethers.utils.parseEther('15')
      const amount2 = ethers.utils.parseEther('25')

      const r1 = {
        geyser: geyser.address,
        vault: vault1,
        amount: amount1,
        permission: '0x',
      }
      const r2 = {
        geyser: geyser.address,
        vault: vault2,
        amount: amount2,
        permission: '0x',
      }

      await expect(router.unstakeAndRestake(r1, r2))
        .to.emit(geyser, 'Staked')
        .withArgs(vault1, amount1, '0x')
        .and.to.emit(geyser, 'UnstakedAndClaimed')
        .withArgs(vault2, amount2, '0x')
    })
  })
})
