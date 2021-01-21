import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { deployContract } from '../utils'

describe('Ownable', function () {
  let accounts: SignerWithAddress[]
  let MockOwnable: Contract

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    MockOwnable = await deployContract('MockOwnable', [accounts[0].address])
  })

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
