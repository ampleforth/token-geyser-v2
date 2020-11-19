import { ethers, network } from 'hardhat'
import { BigNumberish, Contract, Signer } from 'ethers'
import { HardHatSigner } from './utils'

import { expect } from 'chai'

describe('RewardPool', function () {
  let accounts: HardHatSigner[]
  let PowerSwitch: Contract
  let StakingToken: Contract
  let ERC20: Contract
  let Mock: Contract
  let Geyser: Signer
  const amount = ethers.utils.parseEther('10')

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    // deploy mock
    await deployPowerSwitch()
    StakingToken = await deployERC20(accounts[0].address, amount)
    await deployMock()
    await StakingToken.transfer(Mock.address, amount)
    ERC20 = await deployERC20(Mock.address, amount)
  })

  async function deployPowerSwitch() {
    const factory = await ethers.getContractFactory('PowerSwitch')
    PowerSwitch = await factory.deploy(accounts[1].address)
    await PowerSwitch.deployed()
  }

  async function deployERC20(recipient: string, amount: BigNumberish) {
    const factory = await ethers.getContractFactory('MockERC20')
    const ERC20 = await factory.deploy(recipient, amount)
    await ERC20.deployed()
    return ERC20
  }

  async function deployMock() {
    const template = await (await ethers.getContractFactory('Vault')).deploy()
    const CloneFactory = await (
      await ethers.getContractFactory('MockCloneFactory')
    ).deploy()
    await accounts[0].sendTransaction({
      to: CloneFactory.address,
      value: amount,
    })
    const args = (
      await template.populateTransaction.initialize(
        StakingToken.address,
        accounts[0].address,
        PowerSwitch.address,
      )
    ).data
    const instance = await CloneFactory.callStatic.create(
      template.address,
      args,
    )
    await CloneFactory.create(template.address, args)
    Mock = await ethers.getContractAt('Vault', instance, accounts[0])
    await network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [CloneFactory.address],
    })
    Geyser = ethers.provider.getSigner(CloneFactory.address)
  }

  describe('owner', function () {
    it('should succeed', async function () {
      expect(await Mock.owner()).to.eq(accounts[0].address)
    })
  })

  describe('getStakingToken', function () {
    it('should succeed', async function () {
      expect(await Mock.getStakingToken()).to.eq(StakingToken.address)
    })
  })

  describe('getGeyser', function () {
    it('should succeed', async function () {
      expect(await Mock.getGeyser()).to.eq(await Geyser.getAddress())
    })
  })

  describe('sendERC20', function () {
    describe('online - staking token', function () {
      it('should fail if msg.sender is admin', async function () {
        expect(await Mock.isOnline()).to.eq(true)
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            StakingToken.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith(
          'Vault: only geyser can transfer staking token when online',
        )
      })
      it('should succeed if msg.sender is geyser', async function () {
        expect(await Mock.isOnline()).to.eq(true)
        await Mock.connect(Geyser).sendERC20(
          StakingToken.address,
          accounts[0].address,
          amount,
        )
      })
    })
    describe('online - other token', function () {
      it('should succeed if msg.sender is admin', async function () {
        expect(await Mock.isOnline()).to.eq(true)
        await Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          amount,
        )
      })
      it('should fail if msg.sender is geyser', async function () {
        expect(await Mock.isOnline()).to.eq(true)
        await expect(
          Mock.connect(Geyser).sendERC20(
            ERC20.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith('Vault: only owner can transfer')
      })
    })
    describe('offline - staking token', function () {
      it('should fail if msg.sender is admin', async function () {
        await PowerSwitch.connect(accounts[1]).powerOff()
        expect(await Mock.isOffline()).to.eq(true)
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            StakingToken.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith(
          'Vault: cannot transfer staking token when offline',
        )
      })
      it('should fail if msg.sender is geyser', async function () {
        await PowerSwitch.connect(accounts[1]).powerOff()
        expect(await Mock.isOffline()).to.eq(true)
        await expect(
          Mock.connect(Geyser).sendERC20(
            StakingToken.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith(
          'Vault: cannot transfer staking token when offline',
        )
      })
    })
    describe('offline - other token', function () {
      it('should succeed if msg.sender is admin', async function () {
        await PowerSwitch.connect(accounts[1]).powerOff()
        expect(await Mock.isOffline()).to.eq(true)
        await Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          amount,
        )
      })
      it('should fail if msg.sender is geyser', async function () {
        await PowerSwitch.connect(accounts[1]).powerOff()
        expect(await Mock.isOffline()).to.eq(true)
        await expect(
          Mock.connect(Geyser).sendERC20(
            ERC20.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith('Vault: only owner can transfer')
      })
    })
    describe('shutdown - staking token', function () {
      it('should succeed if msg.sender is admin', async function () {
        await PowerSwitch.connect(accounts[1]).emergencyShutdown()
        expect(await Mock.isShutdown()).to.eq(true)
        await Mock.connect(accounts[0]).sendERC20(
          StakingToken.address,
          accounts[0].address,
          amount,
        )
      })
      it('should fail if msg.sender is geyser', async function () {
        await PowerSwitch.connect(accounts[1]).emergencyShutdown()
        expect(await Mock.isShutdown()).to.eq(true)
        await expect(
          Mock.connect(Geyser).sendERC20(
            StakingToken.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith('Vault: only owner can transfer')
      })
    })
    describe('shutdown - other token', function () {
      it('should succeed if msg.sender is admin', async function () {
        await PowerSwitch.connect(accounts[1]).emergencyShutdown()
        expect(await Mock.isShutdown()).to.eq(true)
        await Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          amount,
        )
      })
      it('should fail if msg.sender is geyser', async function () {
        await PowerSwitch.connect(accounts[1]).emergencyShutdown()
        expect(await Mock.isShutdown()).to.eq(true)
        await expect(
          Mock.connect(Geyser).sendERC20(
            ERC20.address,
            accounts[0].address,
            amount,
          ),
        ).to.be.revertedWith('Vault: only owner can transfer')
      })
    })
    describe('recipient', function () {
      it('should fail if recipient is self', async function () {
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            ERC20.address,
            Mock.address,
            amount,
          ),
        ).to.be.revertedWith('Vault: cannot transfer tokens back to the vault')
      })
      it('should fail if recipient is address(0)', async function () {
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            ERC20.address,
            ethers.constants.AddressZero,
            amount,
          ),
        ).to.be.revertedWith('Vault: cannot transfer tokens to null')
      })
      it('should fail if recipient is token', async function () {
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            ERC20.address,
            ERC20.address,
            amount,
          ),
        ).to.be.revertedWith('Vault: cannot transfer tokens to token')
      })
      it('should fail if recipient is geyser', async function () {
        await expect(
          Mock.connect(accounts[0]).sendERC20(
            ERC20.address,
            await Geyser.getAddress(),
            amount,
          ),
        ).to.be.revertedWith('Vault: cannot transfer tokens to geyser')
      })
    })
    describe('amount', function () {
      it('should succeed with full balance', async function () {
        let txPromise = Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          amount,
        )
        await expect(txPromise)
          .to.emit(ERC20, 'Transfer')
          .withArgs(Mock.address, accounts[0].address, amount)
      })
      it('should succeed with partial balance', async function () {
        let txPromise = Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          amount.div(2),
        )
        await expect(txPromise)
          .to.emit(ERC20, 'Transfer')
          .withArgs(Mock.address, accounts[0].address, amount.div(2))
      })
      it('should succeed with no balance', async function () {
        let txPromise = Mock.connect(accounts[0]).sendERC20(
          ERC20.address,
          accounts[0].address,
          '0',
        )
        await expect(txPromise)
          .to.emit(ERC20, 'Transfer')
          .withArgs(Mock.address, accounts[0].address, '0')
      })
    })
  })
})
