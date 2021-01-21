import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { deployContract } from '../utils'

describe('ExternalCall', function () {
  let accounts: SignerWithAddress[]
  let Mock: Contract, Target: Contract

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    Target = await deployContract('MockExternalContract')
    Mock = await deployContract('MockExternalCall')
  })

  describe('externalCall', function () {
    describe('with insufficient gas', function () {
      it('should fail', async function () {
        await expect(
          Mock.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.emitEvent()).data,
            50000,
            { gasLimit: 50000 },
          ),
        ).to.be.revertedWith('ExternalCall: Not enough gas to execute call')
      })
    })
    describe('with gas manually set', function () {
      it('should succeed', async function () {
        await Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.emitEvent()).data,
          30000,
        )
      })
      it('should return correct value', async function () {
        expect(
          await Mock.callStatic.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.emitEvent()).data,
            30000,
          ),
        ).to.eq(true)
      })
      it('should emit event', async function () {
        const txPromise = Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.emitEvent()).data,
          30000,
        )
        await expect(txPromise).to.emit(Mock, 'ExternalCallSuccess')
        await expect(txPromise).to.emit(Target, 'Called')
      })
    })
    describe('calling revert function', function () {
      it('should succeed', async function () {
        await Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.revertFunction()).data,
          0,
        )
      })
      it('should return correct value', async function () {
        expect(
          await Mock.callStatic.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.revertFunction()).data,
            0,
          ),
        ).to.eq(false)
      })
      it('should emit event', async function () {
        await expect(
          Mock.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.revertFunction()).data,
            0,
          ),
        ).to.emit(Mock, 'ExternalCallFailure')
      })
    })
    describe('calling view function', function () {
      it('should succeed', async function () {
        await Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.viewFunction()).data,
          0,
        )
      })
      it('should return correct value', async function () {
        expect(
          await Mock.callStatic.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.viewFunction()).data,
            0,
          ),
        ).to.eq(true)
      })
      it('should emit event', async function () {
        await expect(
          Mock.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.viewFunction()).data,
            0,
          ),
        ).to.emit(Mock, 'ExternalCallSuccess')
      })
    })
    describe('calling normal function', function () {
      it('should succeed', async function () {
        await Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.emitEvent()).data,
          0,
        )
      })
      it('should return correct value', async function () {
        expect(
          await Mock.callStatic.externalCall(
            Target.address,
            0,
            (await Target.populateTransaction.emitEvent()).data,
            0,
          ),
        ).to.eq(true)
      })
      it('should emit event', async function () {
        const txPromise = Mock.externalCall(
          Target.address,
          0,
          (await Target.populateTransaction.emitEvent()).data,
          0,
        )
        await expect(txPromise).to.emit(Mock, 'ExternalCallSuccess')
        await expect(txPromise).to.emit(Target, 'Called')
      })
    })
    describe('receiving eth', function () {
      it('should succeed', async function () {
        await accounts[0].sendTransaction({ to: Mock.address, value: 10 })
      })
    })
    describe('sending eth', function () {
      it('should succeed', async function () {
        await Mock.externalCall(Target.address, 10, '0x', 0, { value: 10 })
      })
      it('should return correct value', async function () {
        expect(
          await Mock.callStatic.externalCall(Target.address, 10, '0x', 0, {
            value: 10,
          }),
        ).to.eq(true)
      })
      it('should emit event', async function () {
        await expect(
          Mock.externalCall(Target.address, 10, '0x', 0, { value: 10 }),
        ).to.emit(Mock, 'ExternalCallSuccess')
      })
    })
  })
})
