import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { HardHatSigner } from '../utils'

import { expect } from 'chai'

describe('ERC1271', function () {
  let accounts: HardHatSigner[]
  let MockERC1271: Contract
  const message = 'ERC1271 test message'
  const messageHash = ethers.utils.hashMessage(message)
  let VALID_SIG: string
  const INVALID_SIG = '0xffffffff'

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    await deployMock()
  })

  async function deployMock() {
    const factory = await ethers.getContractFactory('MockERC1271')
    MockERC1271 = await factory.deploy()
    await MockERC1271.deployed()
    VALID_SIG = MockERC1271.interface.getSighash(
      'isValidSignature(bytes32,bytes)',
    )
  }

  describe('isValidSignature', function () {
    describe('base case', function () {
      it('should return error value if signed by account other than owner', async function () {
        const sig = await accounts[1].signMessage(message)
        expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
          INVALID_SIG,
        )
      })

      it('should revert if signature has incorrect length', async function () {
        const sig = await accounts[0].signMessage(message)
        expect(
          MockERC1271.isValidSignature(messageHash, sig.slice(0, 10)),
        ).to.be.revertedWith('ERC1271: Invalid signature length')
      })

      it('should return success value if signed by owner', async function () {
        const sig = await accounts[0].signMessage(message)
        expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
          VALID_SIG,
        )
      })
    })

    describe('ownership transferred', function () {
      it('should return error value if signed by account other than owner', async function () {
        await MockERC1271.connect(accounts[0]).transferOwnership(
          accounts[1].address,
        )
        const sig = await accounts[0].signMessage(message)
        expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
          INVALID_SIG,
        )
      })

      it('should revert if signature has incorrect length', async function () {
        await MockERC1271.connect(accounts[0]).transferOwnership(
          accounts[1].address,
        )
        const sig = await accounts[1].signMessage(message)
        expect(
          MockERC1271.isValidSignature(messageHash, sig.slice(0, 10)),
        ).to.be.revertedWith('ERC1271: Invalid signature length')
      })

      it('should return success value if signed by owner', async function () {
        await MockERC1271.connect(accounts[0]).transferOwnership(
          accounts[1].address,
        )
        const sig = await accounts[1].signMessage(message)
        expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
          VALID_SIG,
        )
      })
    })
  })
})
