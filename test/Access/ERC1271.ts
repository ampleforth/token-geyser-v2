import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { deployContract } from '../utils'

describe('ERC1271', function () {
  let accounts: SignerWithAddress[]
  let MockERC1271: Contract
  const message = 'ERC1271 test message'
  const messageHash = ethers.utils.arrayify(ethers.utils.hashMessage(message))
  let VALID_SIG: string
  const INVALID_SIG = '0xffffffff'

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    MockERC1271 = await deployContract('MockERC1271', [accounts[0].address])
    VALID_SIG = MockERC1271.interface.getSighash(
      'isValidSignature(bytes32,bytes)',
    )
  })

  describe('isValidSignature', function () {
    it('should return error value if signed by account other than owner', async function () {
      const sig = await accounts[1].signMessage(messageHash)
      expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
        INVALID_SIG,
      )
    })

    it('should revert if signature has incorrect length', async function () {
      const sig = await accounts[0].signMessage(messageHash)
      expect(
        MockERC1271.isValidSignature(messageHash, sig.slice(0, 10)),
      ).to.be.revertedWith('ECDSA: invalid signature length')
    })

    it('should return success value if signed by owner', async function () {
      const sig = await accounts[0].signMessage(messageHash)
      expect(await MockERC1271.isValidSignature(messageHash, sig)).to.eq(
        VALID_SIG,
      )
    })
  })
})
