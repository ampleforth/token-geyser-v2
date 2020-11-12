import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { HardHatSigner } from '../utils'

import { expect } from 'chai'

describe('Ownable', function () {
  let accounts: HardHatSigner[]
  let MockOwnable: Contract

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    await deployMock()
  })

  async function deployMock() {
    const factory = await ethers.getContractFactory('MockOwnable')
    MockOwnable = await factory.deploy(accounts[0].address)
    await MockOwnable.deployed()
  }

  describe('restrictedCall', function () {
    it('should fail if not called by owner', async function () {
      expect(await MockOwnable.owner()).to.eq(accounts[0].address)
      await expect(
        MockOwnable.connect(accounts[1]).restrictedCall(),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should succeed if called by owner', async function () {
      await expect(MockOwnable.connect(accounts[0]).restrictedCall()).to.not.be
        .reverted
    })
  })

  describe('transferOwnership', function () {
    it('should fail if not called by owner', async function () {
      expect(await MockOwnable.owner()).to.eq(accounts[0].address)
      await expect(
        MockOwnable.connect(accounts[1]).transferOwnership(accounts[1].address),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should succeed if called by owner', async function () {
      const txPromise = MockOwnable.connect(accounts[0]).transferOwnership(
        accounts[1].address,
      )
      await expect(txPromise)
        .to.emit(MockOwnable, 'OwnershipTransferred')
        .withArgs(accounts[0].address, accounts[1].address)
      expect(await MockOwnable.owner()).to.eq(accounts[1].address)
    })
  })

  describe('renounceOwnership', function () {
    it('should fail if not called by owner', async function () {
      expect(await MockOwnable.owner()).to.eq(accounts[0].address)
      await expect(
        MockOwnable.connect(accounts[1]).renounceOwnership(),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('should succeed if called by owner', async function () {
      const txPromise = MockOwnable.connect(accounts[0]).renounceOwnership()
      await expect(txPromise)
        .to.emit(MockOwnable, 'OwnershipTransferred')
        .withArgs(accounts[0].address, ethers.constants.AddressZero)
      expect(await MockOwnable.owner()).to.eq(ethers.constants.AddressZero)
    })
  })
})
