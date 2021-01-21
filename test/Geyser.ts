import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { BigNumber, BigNumberish, Contract } from 'ethers'
import { ethers, upgrades } from 'hardhat'
import {
  createInstance,
  deployAmpl,
  deployContract,
  deployGeyser,
  getTimestamp,
  increaseTime,
  invokeRebase,
  signPermission,
} from './utils'

upgrades.silenceWarnings()

/* 

  Dev note: This test file suffers from indeterminancy based on timestamp manipulation.

  If you are encountering tests which fail unexpectedly, make sure increaseTime() is 
  correctly setting the timestamp of the next block.

*/

// todo: add ragequit tests
// todo: fix evm_increaseTime failed error

describe('Geyser', function () {
  let accounts: SignerWithAddress[],
    admin: SignerWithAddress,
    user: SignerWithAddress

  let powerSwitchFactory: Contract,
    rewardPoolFactory: Contract,
    vaultFactory: Contract,
    stakingToken: Contract,
    rewardToken: Contract,
    bonusToken: Contract

  const mockTokenSupply = ethers.utils.parseEther('1000')
  const BASE_SHARES_PER_WEI = 1000000
  const DAY = 24 * 3600
  const YEAR = 365 * DAY
  const rewardScaling = { floor: 33, ceiling: 100, time: 60 * DAY }

  let amplInitialSupply: BigNumber

  const deposit = async (
    user: SignerWithAddress,
    geyser: Contract,
    vault: Contract,
    stakingToken: Contract,
    amount: BigNumberish,
    vaultNonce?: BigNumberish,
  ) => {
    // sign permission
    const signedPermission = await signPermission(
      'lock',
      user,
      vault,
      geyser.address,
      stakingToken.address,
      amount,
      vaultNonce,
    )
    // stake on geyser
    return geyser.deposit(vault.address, amount, signedPermission)
  }

  const withdraw = async (
    vaultOwner: SignerWithAddress,
    recipient: string,
    geyser: Contract,
    vault: Contract,
    stakingToken: Contract,
    amount: BigNumberish,
    vaultNonce?: BigNumberish,
  ) => {
    // sign permission
    const signedPermission = await signPermission(
      'unlock',
      vaultOwner,
      vault,
      geyser.address,
      stakingToken.address,
      amount,
      vaultNonce,
    )
    // unstake on geyser
    return geyser.withdraw(vault.address, recipient, amount, signedPermission)
  }

  function calculateExpectedReward(
    depositAmount: BigNumber,
    stakeDuration: BigNumberish,
    rewardAvailable: BigNumber,
    otherStakeUnits: BigNumberish,
  ) {
    const stakeUnits = depositAmount.mul(stakeDuration)
    const baseReward = rewardAvailable
      .mul(stakeUnits)
      .div(stakeUnits.add(otherStakeUnits))
    const minReward = baseReward.mul(rewardScaling.floor).div(100)
    const bonusReward = baseReward
      .mul(rewardScaling.ceiling - rewardScaling.floor)
      .mul(stakeDuration)
      .div(rewardScaling.time)
      .div(100)
    return stakeDuration >= rewardScaling.time
      ? baseReward
      : minReward.add(bonusReward)
  }

  beforeEach(async function () {
    // prepare signers
    accounts = await ethers.getSigners()
    admin = accounts[1]
    user = accounts[2]

    // deploy dependencies
    powerSwitchFactory = await deployContract('PowerSwitchFactory')
    rewardPoolFactory = await deployContract('RewardPoolFactory')
    const vaultTemplate = await deployContract('UniversalVault')
    vaultFactory = await deployContract('VaultFactory', [vaultTemplate.address])

    // deploy mock tokens
    stakingToken = await deployContract('MockERC20', [
      admin.address,
      mockTokenSupply,
    ])
    ;({ ampl: rewardToken, amplInitialSupply } = await deployAmpl(admin))
    bonusToken = await deployContract('MockERC20', [
      admin.address,
      mockTokenSupply,
    ])
  })

  describe('initialize', function () {
    describe('when rewardScaling.floor > rewardScaling.ceiling', function () {
      it('should fail', async function () {
        const args = [
          admin.address,
          rewardPoolFactory.address,
          powerSwitchFactory.address,
          stakingToken.address,
          rewardToken.address,
          [
            rewardScaling.ceiling + 1,
            rewardScaling.ceiling,
            rewardScaling.time,
          ],
        ]
        await expect(deployGeyser(args)).to.be.reverted
      })
    })
    describe('when rewardScalingTime = 0', function () {
      it('should fail', async function () {
        const args = [
          admin.address,
          rewardPoolFactory.address,
          powerSwitchFactory.address,
          stakingToken.address,
          rewardToken.address,
          [rewardScaling.floor, rewardScaling.ceiling, 0],
        ]
        await expect(deployGeyser(args)).to.be.reverted
      })
    })
    describe('when parameters are valid', function () {
      it('should set contract variables', async function () {
        const args = [
          admin.address,
          rewardPoolFactory.address,
          powerSwitchFactory.address,
          stakingToken.address,
          rewardToken.address,
          [rewardScaling.floor, rewardScaling.ceiling, rewardScaling.time],
        ]
        const geyser = await deployGeyser(args)

        const data = await geyser.getGeyserData()

        expect(data.stakingToken).to.eq(stakingToken.address)
        expect(data.rewardToken).to.eq(rewardToken.address)
        expect(data.rewardPool).to.not.eq(ethers.constants.AddressZero)
        expect(data.rewardScaling.floor).to.eq(33)
        expect(data.rewardScaling.ceiling).to.eq(100)
        expect(data.rewardSharesOutstanding).to.eq(0)
        expect(data.totalStake).to.eq(0)
        expect(data.totalStakeUnits).to.eq(0)
        expect(data.lastUpdate).to.eq(0)
        expect(data.rewardSchedules).to.deep.eq([])
        expect(await geyser.getBonusTokenSetLength()).to.eq(0)
        expect(await geyser.owner()).to.eq(admin.address)
        expect(await geyser.getPowerSwitch()).to.not.eq(
          ethers.constants.AddressZero,
        )
        expect(await geyser.getPowerController()).to.eq(admin.address)
        expect(await geyser.isOnline()).to.eq(true)
        expect(await geyser.isOffline()).to.eq(false)
        expect(await geyser.isShutdown()).to.eq(false)
      })
    })
  })

  describe('admin functions', function () {
    let geyser: Contract, powerSwitch: Contract, rewardPool: Contract
    beforeEach(async function () {
      const args = [
        admin.address,
        rewardPoolFactory.address,
        powerSwitchFactory.address,
        stakingToken.address,
        rewardToken.address,
        [rewardScaling.floor, rewardScaling.ceiling, rewardScaling.time],
      ]
      geyser = await deployGeyser(args)
      powerSwitch = await ethers.getContractAt(
        'PowerSwitch',
        await geyser.getPowerSwitch(),
      )
      rewardPool = await ethers.getContractAt(
        'RewardPool',
        (await geyser.getGeyserData()).rewardPool,
      )
    })
    describe('fundGeyser', function () {
      describe('with insufficient approval', function () {
        it('should fail', async function () {
          await expect(
            geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
          ).to.be.reverted
        })
      })
      describe('with duration of zero', function () {
        it('should fail', async function () {
          await rewardToken
            .connect(admin)
            .approve(geyser.address, amplInitialSupply)
          await expect(
            geyser.connect(admin).fundGeyser(amplInitialSupply, 0),
          ).to.be.revertedWith('Geyser: invalid duration')
        })
      })
      describe('as user', function () {
        it('should fail', async function () {
          await rewardToken
            .connect(admin)
            .transfer(user.address, amplInitialSupply)
          await rewardToken
            .connect(user)
            .approve(geyser.address, amplInitialSupply)
          await expect(
            geyser.connect(user).fundGeyser(amplInitialSupply, YEAR),
          ).to.be.revertedWith('Ownable: caller is not the owner')
        })
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await rewardToken
            .connect(admin)
            .approve(geyser.address, amplInitialSupply)
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await rewardToken
            .connect(admin)
            .approve(geyser.address, amplInitialSupply)
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when online', function () {
        beforeEach(async function () {
          await rewardToken
            .connect(admin)
            .approve(geyser.address, amplInitialSupply)
        })
        describe('at first funding', function () {
          it('should succeed', async function () {
            await geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR)
          })
          it('should update state correctly', async function () {
            await geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR)

            const data = await geyser.getGeyserData()

            expect(data.rewardSharesOutstanding).to.eq(
              amplInitialSupply.mul(BASE_SHARES_PER_WEI),
            )
            expect(data.rewardSchedules.length).to.eq(1)
            expect(data.rewardSchedules[0].duration).to.eq(YEAR)
            expect(data.rewardSchedules[0].start).to.eq(await getTimestamp())
            expect(data.rewardSchedules[0].shares).to.eq(
              amplInitialSupply.mul(BASE_SHARES_PER_WEI),
            )
          })
          it('should emit event', async function () {
            await expect(
              geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
            )
              .to.emit(geyser, 'GeyserFunded')
              .withArgs(amplInitialSupply, YEAR)
          })
          it('should transfer tokens', async function () {
            await expect(
              geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
            )
              .to.emit(rewardToken, 'Transfer')
              .withArgs(admin.address, rewardPool.address, amplInitialSupply)
          })
        })
        describe('at second funding', function () {
          beforeEach(async function () {
            await geyser
              .connect(admin)
              .fundGeyser(amplInitialSupply.div(2), YEAR)
          })
          describe('with no rebase', function () {
            it('should succeed', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), YEAR)
            })
            it('should update state correctly', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), YEAR)

              const data = await geyser.getGeyserData()

              expect(data.rewardSharesOutstanding).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI),
              )
              expect(data.rewardSchedules.length).to.eq(2)
              expect(data.rewardSchedules[0].duration).to.eq(YEAR)
              expect(data.rewardSchedules[0].start).to.eq(
                (await getTimestamp()) - 1,
              )
              expect(data.rewardSchedules[0].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules[1].duration).to.eq(YEAR)
              expect(data.rewardSchedules[1].start).to.eq(await getTimestamp())
              expect(data.rewardSchedules[1].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), YEAR),
              )
                .to.emit(geyser, 'GeyserFunded')
                .withArgs(amplInitialSupply.div(2), YEAR)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), YEAR),
              )
                .to.emit(rewardToken, 'Transfer')
                .withArgs(
                  admin.address,
                  rewardPool.address,
                  amplInitialSupply.div(2),
                )
            })
          })
          describe('with positive rebase of 200%', function () {
            beforeEach(async function () {
              // rebase of 100 doubles the inital supply
              await invokeRebase(rewardToken, 100, admin)
              await rewardToken
                .connect(admin)
                .approve(geyser.address, amplInitialSupply)
            })
            it('should succeed', async function () {
              await geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR)
            })
            it('should update state correctly', async function () {
              await geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR)

              const data = await geyser.getGeyserData()

              expect(data.rewardSharesOutstanding).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI),
              )
              expect(data.rewardSchedules.length).to.eq(2)
              expect(data.rewardSchedules[0].duration).to.eq(YEAR)
              expect(data.rewardSchedules[0].start).to.eq(
                (await getTimestamp()) - 3,
              )
              expect(data.rewardSchedules[0].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules[1].duration).to.eq(YEAR)
              expect(data.rewardSchedules[1].start).to.eq(await getTimestamp())
              expect(data.rewardSchedules[1].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
              )
                .to.emit(geyser, 'GeyserFunded')
                .withArgs(amplInitialSupply, YEAR)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR),
              )
                .to.emit(rewardToken, 'Transfer')
                .withArgs(admin.address, rewardPool.address, amplInitialSupply)
            })
          })
          describe('with negative rebase of 50%', function () {
            beforeEach(async function () {
              // rebase of -50 halves the inital supply
              await invokeRebase(rewardToken, -50, admin)
            })
            it('should succeed', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(4), YEAR)
            })
            it('should update state correctly', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(4), YEAR)

              const data = await geyser.getGeyserData()

              expect(data.rewardSharesOutstanding).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI),
              )
              expect(data.rewardSchedules.length).to.eq(2)
              expect(data.rewardSchedules[0].duration).to.eq(YEAR)
              expect(data.rewardSchedules[0].start).to.eq(
                (await getTimestamp()) - 2,
              )
              expect(data.rewardSchedules[0].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules[1].duration).to.eq(YEAR)
              expect(data.rewardSchedules[1].start).to.eq(await getTimestamp())
              expect(data.rewardSchedules[1].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(4), YEAR),
              )
                .to.emit(geyser, 'GeyserFunded')
                .withArgs(amplInitialSupply.div(4), YEAR)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(4), YEAR),
              )
                .to.emit(rewardToken, 'Transfer')
                .withArgs(
                  admin.address,
                  rewardPool.address,
                  amplInitialSupply.div(4),
                )
            })
          })
        })
        describe('after withdrawl', function () {
          const depositAmount = ethers.utils.parseEther('100')

          let vault: Contract
          beforeEach(async function () {
            await geyser
              .connect(admin)
              .registerVaultFactory(vaultFactory.address)
            vault = await createInstance('UniversalVault', vaultFactory, user)

            await stakingToken
              .connect(admin)
              .transfer(vault.address, depositAmount)

            await deposit(user, geyser, vault, stakingToken, depositAmount)

            await increaseTime(rewardScaling.time)

            await rewardToken
              .connect(admin)
              .approve(geyser.address, amplInitialSupply)
            await geyser
              .connect(admin)
              .fundGeyser(amplInitialSupply.div(2), rewardScaling.time)
          })
          describe('with partial rewards exausted', function () {
            beforeEach(async function () {
              await increaseTime(rewardScaling.time / 2)
              await withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              )
            })
            it('should succeed', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), rewardScaling.time)
            })
            it('should update state correctly', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), rewardScaling.time)

              const data = await geyser.getGeyserData()

              expect(data.rewardSharesOutstanding).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).mul(3).div(4),
              )
              expect(data.rewardSchedules.length).to.eq(2)
              expect(data.rewardSchedules[0].duration).to.eq(rewardScaling.time)
              expect(data.rewardSchedules[0].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules[1].duration).to.eq(rewardScaling.time)
              expect(data.rewardSchedules[1].start).to.eq(await getTimestamp())
              expect(data.rewardSchedules[1].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), rewardScaling.time),
              )
                .to.emit(geyser, 'GeyserFunded')
                .withArgs(amplInitialSupply.div(2), rewardScaling.time)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), rewardScaling.time),
              )
                .to.emit(rewardToken, 'Transfer')
                .withArgs(
                  admin.address,
                  rewardPool.address,
                  amplInitialSupply.div(2),
                )
            })
          })
          describe('with full rewards exausted', function () {
            beforeEach(async function () {
              await increaseTime(rewardScaling.time)
              await withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              )
            })
            it('should succeed', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), rewardScaling.time)
            })
            it('should update state correctly', async function () {
              await geyser
                .connect(admin)
                .fundGeyser(amplInitialSupply.div(2), rewardScaling.time)

              const data = await geyser.getGeyserData()

              expect(data.rewardSharesOutstanding).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules.length).to.eq(2)
              expect(data.rewardSchedules[0].duration).to.eq(rewardScaling.time)
              expect(data.rewardSchedules[0].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
              expect(data.rewardSchedules[1].duration).to.eq(rewardScaling.time)
              expect(data.rewardSchedules[1].start).to.eq(await getTimestamp())
              expect(data.rewardSchedules[1].shares).to.eq(
                amplInitialSupply.mul(BASE_SHARES_PER_WEI).div(2),
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), rewardScaling.time),
              )
                .to.emit(geyser, 'GeyserFunded')
                .withArgs(amplInitialSupply.div(2), rewardScaling.time)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .fundGeyser(amplInitialSupply.div(2), rewardScaling.time),
              )
                .to.emit(rewardToken, 'Transfer')
                .withArgs(
                  admin.address,
                  rewardPool.address,
                  amplInitialSupply.div(2),
                )
            })
          })
        })
      })
    })

    describe('registerVaultFactory', function () {
      // todo
    })
    describe('removeVaultFactory', function () {
      // todo
    })

    describe('registerBonusToken', function () {
      describe('as user', function () {
        it('should fail', async function () {
          await expect(
            geyser.connect(user).registerBonusToken(bonusToken.address),
          ).to.be.revertedWith('Ownable: caller is not the owner')
        })
      })
      describe('when online', function () {
        describe('on first call', function () {
          describe('with address zero', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .registerBonusToken(ethers.constants.AddressZero),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with geyser address', function () {
            it('should fail', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(geyser.address),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with staking token', function () {
            it('should fail', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(stakingToken.address),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with reward token', function () {
            it('should fail', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(rewardToken.address),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with rewardPool address', function () {
            it('should fail', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(rewardPool.address),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with bonus token', function () {
            it('should succeed', async function () {
              await geyser.connect(admin).registerBonusToken(bonusToken.address)
            })
            it('should update state', async function () {
              await geyser.connect(admin).registerBonusToken(bonusToken.address)
              expect(await geyser.getBonusTokenSetLength()).to.eq(1)
              expect(await geyser.getBonusTokenAtIndex(0)).to.eq(
                bonusToken.address,
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(bonusToken.address),
              )
                .to.emit(geyser, 'BonusTokenRegistered')
                .withArgs(bonusToken.address)
            })
          })
        })
        describe('on second call', function () {
          beforeEach(async function () {
            await geyser.connect(admin).registerBonusToken(bonusToken.address)
          })
          describe('with same token', function () {
            it('should fail', async function () {
              await expect(
                geyser.connect(admin).registerBonusToken(bonusToken.address),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('with different bonus token', function () {
            let secondBonusToken: Contract
            beforeEach(async function () {
              secondBonusToken = await deployContract('MockERC20', [
                admin.address,
                mockTokenSupply,
              ])
            })
            it('should succeed', async function () {
              await geyser
                .connect(admin)
                .registerBonusToken(secondBonusToken.address)
            })
            it('should update state', async function () {
              await geyser
                .connect(admin)
                .registerBonusToken(secondBonusToken.address)
              expect(await geyser.getBonusTokenSetLength()).to.eq(2)
              expect(await geyser.getBonusTokenAtIndex(0)).to.eq(
                bonusToken.address,
              )
              expect(await geyser.getBonusTokenAtIndex(1)).to.eq(
                secondBonusToken.address,
              )
            })
            it('should emit event', async function () {
              await expect(
                geyser
                  .connect(admin)
                  .registerBonusToken(secondBonusToken.address),
              )
                .to.emit(geyser, 'BonusTokenRegistered')
                .withArgs(secondBonusToken.address)
            })
          })
        })
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser.connect(admin).registerBonusToken(bonusToken.address),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser.connect(admin).registerBonusToken(bonusToken.address),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
    })

    describe('rescueTokensFromRewardPool', function () {
      let otherToken: Contract
      beforeEach(async function () {
        otherToken = await deployContract('MockERC20', [
          admin.address,
          mockTokenSupply,
        ])
        await otherToken
          .connect(admin)
          .transfer(rewardPool.address, mockTokenSupply)
        await geyser.connect(admin).registerBonusToken(bonusToken.address)
      })
      describe('as user', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(user)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Ownable: caller is not the owner')
        })
      })
      describe('with reward token', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                rewardToken.address,
                admin.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with bonus token', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                bonusToken.address,
                admin.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with staking token', function () {
        beforeEach(async function () {
          await stakingToken
            .connect(admin)
            .transfer(rewardPool.address, mockTokenSupply)
        })
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(
              stakingToken.address,
              admin.address,
              mockTokenSupply,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                stakingToken.address,
                admin.address,
                mockTokenSupply,
              ),
          )
            .to.emit(stakingToken, 'Transfer')
            .withArgs(rewardPool.address, admin.address, mockTokenSupply)
        })
      })
      describe('with geyser as recipient', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                geyser.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with staking token as recipient', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                stakingToken.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with reward token as recipient', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                rewardToken.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with rewardPool as recipient', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                rewardPool.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with address 0 as recipient', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                ethers.constants.AddressZero,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Geyser: invalid address')
        })
      })
      describe('with other address as recipient', function () {
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(
              otherToken.address,
              user.address,
              mockTokenSupply,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                user.address,
                mockTokenSupply,
              ),
          )
            .to.emit(otherToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, mockTokenSupply)
        })
      })
      describe('with zero amount', function () {
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(otherToken.address, admin.address, 0)
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(otherToken.address, admin.address, 0),
          )
            .to.emit(otherToken, 'Transfer')
            .withArgs(rewardPool.address, admin.address, 0)
        })
      })
      describe('with partial amount', function () {
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(
              otherToken.address,
              admin.address,
              mockTokenSupply.div(2),
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply.div(2),
              ),
          )
            .to.emit(otherToken, 'Transfer')
            .withArgs(rewardPool.address, admin.address, mockTokenSupply.div(2))
        })
      })
      describe('with full amount', function () {
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(
              otherToken.address,
              admin.address,
              mockTokenSupply,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply,
              ),
          )
            .to.emit(otherToken, 'Transfer')
            .withArgs(rewardPool.address, admin.address, mockTokenSupply)
        })
      })
      describe('with excess amount', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply.mul(2),
              ),
          ).to.be.revertedWith('')
        })
      })
      describe('when online', function () {
        it('should succeed', async function () {
          await geyser
            .connect(admin)
            .rescueTokensFromRewardPool(
              otherToken.address,
              admin.address,
              mockTokenSupply,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply,
              ),
          )
            .to.emit(otherToken, 'Transfer')
            .withArgs(rewardPool.address, admin.address, mockTokenSupply)
        })
      })
      describe('when offline', function () {
        beforeEach(async function () {
          await powerSwitch.connect(admin).powerOff()
        })
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        beforeEach(async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
        })
        it('should fail', async function () {
          await expect(
            geyser
              .connect(admin)
              .rescueTokensFromRewardPool(
                otherToken.address,
                admin.address,
                mockTokenSupply,
              ),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
    })
  })

  describe('user functions', function () {
    let geyser: Contract, powerSwitch: Contract, rewardPool: Contract
    beforeEach(async function () {
      const args = [
        admin.address,
        rewardPoolFactory.address,
        powerSwitchFactory.address,
        stakingToken.address,
        rewardToken.address,
        [rewardScaling.floor, rewardScaling.ceiling, rewardScaling.time],
      ]
      geyser = await deployGeyser(args)
      await geyser.connect(admin).registerVaultFactory(vaultFactory.address)
      powerSwitch = await ethers.getContractAt(
        'PowerSwitch',
        await geyser.getPowerSwitch(),
      )
      rewardPool = await ethers.getContractAt(
        'RewardPool',
        (await geyser.getGeyserData()).rewardPool,
      )
    })

    describe('deposit', function () {
      const depositAmount = mockTokenSupply.div(100)
      let vault: Contract

      beforeEach(async function () {
        vault = await createInstance('UniversalVault', vaultFactory, user)
        await stakingToken.connect(admin).transfer(vault.address, depositAmount)
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('to invalid vault', function () {
        it('should fail', async function () {
          await geyser.connect(admin).removeVaultFactory(vaultFactory.address)
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount),
          ).to.be.revertedWith('Geyser: vault is not registered')
        })
      })
      describe('with amount of zero', function () {
        it('should fail', async function () {
          await expect(
            deposit(user, geyser, vault, stakingToken, '0'),
          ).to.be.revertedWith('Geyser: no amount deposited')
        })
      })
      describe('with insufficient balance', function () {
        it('should fail', async function () {
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount.mul(2)),
          ).to.be.revertedWith('UniversalVault: insufficient balance')
        })
      })
      describe('when not funded', function () {
        it('should succeed', async function () {
          await deposit(user, geyser, vault, stakingToken, depositAmount)
        })
      })
      describe('when funded', function () {
        beforeEach(async function () {
          await rewardToken
            .connect(admin)
            .approve(geyser.address, amplInitialSupply)
          await geyser.connect(admin).fundGeyser(amplInitialSupply, YEAR)
        })
        describe('on first deposit', function () {
          describe('as vault owner', function () {
            it('should succeed', async function () {
              await deposit(user, geyser, vault, stakingToken, depositAmount)
            })
            it('should update state', async function () {
              await deposit(user, geyser, vault, stakingToken, depositAmount)

              const geyserData = await geyser.getGeyserData()
              const vaultData = await geyser.getVaultData(vault.address)

              expect(geyserData.totalStake).to.eq(depositAmount)
              expect(geyserData.totalStakeUnits).to.eq(0)
              expect(geyserData.lastUpdate).to.eq(await getTimestamp())

              expect(vaultData.totalStake).to.eq(depositAmount)
              expect(vaultData.stakes.length).to.eq(1)
              expect(vaultData.stakes[0].amount).to.eq(depositAmount)
              expect(vaultData.stakes[0].timestamp).to.eq(await getTimestamp())
            })
            it('should emit event', async function () {
              await expect(
                deposit(user, geyser, vault, stakingToken, depositAmount),
              )
                .to.emit(geyser, 'Deposit')
                .withArgs(vault.address, depositAmount)
            })
            it('should lock tokens', async function () {
              await expect(
                deposit(user, geyser, vault, stakingToken, depositAmount),
              )
                .to.emit(vault, 'Locked')
                .withArgs(geyser.address, stakingToken.address, depositAmount)
            })
          })
        })
        describe('on second deposit', function () {
          beforeEach(async function () {
            await deposit(
              user,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            )
          })
          it('should succeed', async function () {
            await deposit(
              user,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            )
          })
          it('should update state', async function () {
            await deposit(
              user,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            )

            const geyserData = await geyser.getGeyserData()
            const vaultData = await geyser.getVaultData(vault.address)

            expect(geyserData.totalStake).to.eq(depositAmount)
            expect(geyserData.totalStakeUnits).to.eq(depositAmount.div(2))
            expect(geyserData.lastUpdate).to.eq(await getTimestamp())

            expect(vaultData.totalStake).to.eq(depositAmount)
            expect(vaultData.stakes.length).to.eq(2)
            expect(vaultData.stakes[0].amount).to.eq(depositAmount.div(2))
            expect(vaultData.stakes[0].timestamp).to.eq(
              (await getTimestamp()) - 1,
            )
            expect(vaultData.stakes[1].amount).to.eq(depositAmount.div(2))
            expect(vaultData.stakes[1].timestamp).to.eq(await getTimestamp())
          })
          it('should emit event', async function () {
            await expect(
              deposit(user, geyser, vault, stakingToken, depositAmount.div(2)),
            )
              .to.emit(geyser, 'Deposit')
              .withArgs(vault.address, depositAmount.div(2))
          })
          it('should lock tokens', async function () {
            await expect(
              deposit(user, geyser, vault, stakingToken, depositAmount.div(2)),
            )
              .to.emit(vault, 'Locked')
              .withArgs(
                geyser.address,
                stakingToken.address,
                depositAmount.div(2),
              )
          })
        })
      })
      describe('when deposits reset', function () {
        beforeEach(async function () {
          await deposit(user, geyser, vault, stakingToken, depositAmount)
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should succeed', async function () {
          await deposit(user, geyser, vault, stakingToken, depositAmount)
        })
        it('should update state', async function () {
          await deposit(user, geyser, vault, stakingToken, depositAmount)

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.totalStake).to.eq(depositAmount)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())

          expect(vaultData.totalStake).to.eq(depositAmount)
          expect(vaultData.stakes.length).to.eq(1)
          expect(vaultData.stakes[0].amount).to.eq(depositAmount)
          expect(vaultData.stakes[0].timestamp).to.eq(await getTimestamp())
        })
        it('should emit event', async function () {
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount),
          )
            .to.emit(geyser, 'Deposit')
            .withArgs(vault.address, depositAmount)
        })
        it('should lock tokens', async function () {
          await expect(
            deposit(user, geyser, vault, stakingToken, depositAmount),
          )
            .to.emit(vault, 'Locked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
    })

    describe('withdraw', function () {
      const depositAmount = ethers.utils.parseEther('100')
      const rewardAmount = ethers.utils.parseUnits('1000', 9)

      describe('with default config', function () {
        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(rewardScaling.time)
        })
        describe('when offline', function () {
          it('should fail', async function () {
            await powerSwitch.connect(admin).powerOff()
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            ).to.be.revertedWith('Powered: is not online')
          })
        })
        describe('when shutdown', function () {
          it('should fail', async function () {
            await powerSwitch.connect(admin).emergencyShutdown()
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            ).to.be.revertedWith('Powered: is not online')
          })
        })
        describe('with invalid vault', function () {
          it('should succeed', async function () {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
          })
        })
        describe('as not vault owner', function () {
          it('should fail', async function () {
            await expect(
              withdraw(
                admin,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            ).to.be.revertedWith('ERC1271: Invalid signature')
          })
        })
        describe('with invalid recipient', function () {
          describe('of geyser', function () {
            it('should fail', async function () {
              await expect(
                withdraw(
                  user,
                  geyser.address,
                  geyser,
                  vault,
                  stakingToken,
                  depositAmount,
                ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of address(0)', function () {
            it('should fail', async function () {
              await expect(
                withdraw(
                  user,
                  ethers.constants.AddressZero,
                  geyser,
                  vault,
                  stakingToken,
                  depositAmount,
                ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of staking token', function () {
            it('should fail', async function () {
              await expect(
                withdraw(
                  user,
                  stakingToken.address,
                  geyser,
                  vault,
                  stakingToken,
                  depositAmount,
                ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of reward token', function () {
            it('should fail', async function () {
              await expect(
                withdraw(
                  user,
                  rewardToken.address,
                  geyser,
                  vault,
                  stakingToken,
                  depositAmount,
                ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of reward pool', function () {
            it('should fail', async function () {
              await expect(
                withdraw(
                  user,
                  rewardPool.address,
                  geyser,
                  vault,
                  stakingToken,
                  depositAmount,
                ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
        })
        describe('with amount of zero', function () {
          it('should fail', async function () {
            await expect(
              withdraw(user, user.address, geyser, vault, stakingToken, 0),
            ).to.be.revertedWith('Geyser: no amount withdrawn')
          })
        })
        describe('with amount greater than deposits', function () {
          it('should fail', async function () {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount.add(1),
              ),
            ).to.be.revertedWith('Geyser: insufficient vault stake')
          })
        })
      })
      describe('with fully vested stake', function () {
        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(vault.address, user.address, depositAmount, rewardAmount)
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, rewardAmount)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with partially vested stake', function () {
        const stakeDuration = rewardScaling.time / 2
        const expectedReward = calculateExpectedReward(
          depositAmount,
          stakeDuration,
          rewardAmount,
          0,
        )

        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(stakeDuration)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with floor and ceiling scaled up', function () {
        const stakeDuration = rewardScaling.time / 2
        const expectedReward = calculateExpectedReward(
          depositAmount,
          stakeDuration,
          rewardAmount,
          0,
        )

        let vault: Contract
        beforeEach(async function () {
          const args = [
            admin.address,
            rewardPoolFactory.address,
            powerSwitchFactory.address,
            stakingToken.address,
            rewardToken.address,

            [
              rewardScaling.floor * 2,
              rewardScaling.ceiling * 2,
              rewardScaling.time,
            ],
          ]
          geyser = await deployGeyser(args)
          await geyser.connect(admin).registerVaultFactory(vaultFactory.address)
          powerSwitch = await ethers.getContractAt(
            'PowerSwitch',
            await geyser.getPowerSwitch(),
          )
          rewardPool = await ethers.getContractAt(
            'RewardPool',
            (await geyser.getGeyserData()).rewardPool,
          )

          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(stakeDuration)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with no reward', function () {
        const expectedReward = 0

        let vault: Contract
        beforeEach(async function () {
          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, 0)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with partially vested reward', function () {
        const expectedReward = calculateExpectedReward(
          depositAmount,
          rewardScaling.time,
          rewardAmount.div(2),
          0,
        )

        let vault: Contract
        beforeEach(async function () {
          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(rewardScaling.time)

          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time / 2)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with flash stake', function () {
        let vault: Contract, MockStakeHelper: Contract

        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          MockStakeHelper = await deployContract('MockStakeHelper')
        })
        it('should succeed', async function () {
          await MockStakeHelper.flashStake(
            geyser.address,
            vault.address,
            user.address,
            depositAmount,
            await signPermission(
              'lock',
              user,
              vault,
              geyser.address,
              stakingToken.address,
              depositAmount,
            ),
            await signPermission(
              'unlock',
              user,
              vault,
              geyser.address,
              stakingToken.address,
              depositAmount,
              (await vault.getNonce()).add(1),
            ),
          )
        })
        it('should update state', async function () {
          await MockStakeHelper.flashStake(
            geyser.address,
            vault.address,
            user.address,
            depositAmount,
            await signPermission(
              'lock',
              user,
              vault,
              geyser.address,
              stakingToken.address,
              depositAmount,
            ),
            await signPermission(
              'unlock',
              user,
              vault,
              geyser.address,
              stakingToken.address,
              depositAmount,
              (await vault.getNonce()).add(1),
            ),
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            MockStakeHelper.flashStake(
              geyser.address,
              vault.address,
              user.address,
              depositAmount,
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
              ),
              await signPermission(
                'unlock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
                (await vault.getNonce()).add(1),
              ),
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(vault.address, user.address, depositAmount, 0)
        })
        it('should transfer tokens', async function () {
          await expect(
            MockStakeHelper.flashStake(
              geyser.address,
              vault.address,
              user.address,
              depositAmount,
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
              ),
              await signPermission(
                'unlock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
                (await vault.getNonce()).add(1),
              ),
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, 0)
        })
        it('should lock tokens', async function () {
          await expect(
            MockStakeHelper.flashStake(
              geyser.address,
              vault.address,
              user.address,
              depositAmount,
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
              ),
              await signPermission(
                'unlock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
                (await vault.getNonce()).add(1),
              ),
            ),
          )
            .to.emit(vault, 'Locked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
        it('should unlock tokens', async function () {
          await expect(
            MockStakeHelper.flashStake(
              geyser.address,
              vault.address,
              user.address,
              depositAmount,
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
              ),
              await signPermission(
                'unlock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
                (await vault.getNonce()).add(1),
              ),
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with one second stake', function () {
        const stakeDuration = 1
        const expectedReward = calculateExpectedReward(
          depositAmount,
          stakeDuration,
          rewardAmount,
          0,
        )

        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(stakeDuration)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, depositAmount)
        })
      })
      describe('with partial amount from single deposit', function () {
        const expectedReward = calculateExpectedReward(
          depositAmount.div(2),
          rewardScaling.time,
          rewardAmount,
          depositAmount.div(2).mul(rewardScaling.time),
        )

        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount.div(2),
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            depositAmount.div(2),
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(depositAmount.div(2))
          expect(geyserData.totalStakeUnits).to.eq(
            depositAmount.div(2).mul(rewardScaling.time),
          )
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(depositAmount.div(2))
          expect(vaultData.stakes.length).to.eq(1)
          expect(vaultData.stakes[0].amount).to.eq(depositAmount.div(2))
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              depositAmount.div(2),
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount.div(2),
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(
              geyser.address,
              stakingToken.address,
              depositAmount.div(2),
            )
        })
      })
      describe('with partial amount from multiple deposits', function () {
        const currentDeposit = ethers.utils.parseEther('99')
        const withdrawAmount = currentDeposit.div(2)
        const expectedReward = calculateExpectedReward(
          withdrawAmount,
          rewardScaling.time,
          rewardAmount,
          currentDeposit.div(2).mul(rewardScaling.time),
        ).sub(1) // account for division dust
        const quantity = 3

        let vault: Contract
        beforeEach(async function () {
          // fund geyser
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          // deploy vault and transfer stake
          vault = await createInstance('UniversalVault', vaultFactory, user)
          await stakingToken
            .connect(admin)
            .transfer(vault.address, currentDeposit)

          // perform multiple deposits in same block
          const permissions = []
          for (let index = 0; index < quantity; index++) {
            permissions.push(
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                currentDeposit.div(quantity),
                index,
              ),
            )
          }
          const MockStakeHelper = await deployContract('MockStakeHelper')
          await MockStakeHelper.depositBatch(
            new Array(quantity).fill(undefined).map(() => geyser.address),
            new Array(quantity).fill(undefined).map(() => vault.address),
            new Array(quantity)
              .fill(undefined)
              .map(() => currentDeposit.div(quantity)),
            permissions,
          )

          // increase time to the end of reward scaling
          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            withdrawAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            withdrawAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(
            rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
          )
          expect(geyserData.totalStake).to.eq(
            currentDeposit.sub(withdrawAmount),
          )
          expect(geyserData.totalStakeUnits).to.eq(
            currentDeposit.sub(withdrawAmount).mul(rewardScaling.time),
          )
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(currentDeposit.sub(withdrawAmount))
          expect(vaultData.stakes.length).to.eq(2)
          expect(vaultData.stakes[0].amount).to.eq(currentDeposit.div(3))
          expect(vaultData.stakes[1].amount).to.eq(currentDeposit.div(6))
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              withdrawAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, withdrawAmount)
        })
      })
      describe('with full amount of multiple deposits', function () {
        const currentDeposit = ethers.utils.parseEther('99')
        const withdrawAmount = currentDeposit
        const expectedReward = calculateExpectedReward(
          withdrawAmount,
          rewardScaling.time,
          rewardAmount,
          0,
        )
        const quantity = 3

        let vault: Contract
        beforeEach(async function () {
          // fund geyser
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          // deploy vault and transfer stake
          vault = await createInstance('UniversalVault', vaultFactory, user)
          await stakingToken
            .connect(admin)
            .transfer(vault.address, currentDeposit)

          // perform multiple deposits in same block
          const permissions = []
          for (let index = 0; index < quantity; index++) {
            permissions.push(
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                currentDeposit.div(quantity),
                index,
              ),
            )
          }
          const MockStakeHelper = await deployContract('MockStakeHelper')
          await MockStakeHelper.depositBatch(
            new Array(quantity).fill(geyser.address),
            new Array(quantity).fill(vault.address),
            new Array(quantity).fill(currentDeposit.div(quantity)),
            permissions,
          )

          // increase time to the end of reward scaling
          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            withdrawAmount,
          )
        })
        it('should update state', async function () {
          await withdraw(
            user,
            user.address,
            geyser,
            vault,
            stakingToken,
            withdrawAmount,
          )

          const geyserData = await geyser.getGeyserData()
          const vaultData = await geyser.getVaultData(vault.address)

          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
          expect(vaultData.totalStake).to.eq(0)
          expect(vaultData.stakes.length).to.eq(0)
        })
        it('should emit event', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(
              vault.address,
              user.address,
              withdrawAmount,
              expectedReward,
            )
        })
        it('should transfer tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
        })
        it('should unlock tokens', async function () {
          await expect(
            withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              withdrawAmount,
            ),
          )
            .to.emit(vault, 'Unlocked')
            .withArgs(geyser.address, stakingToken.address, withdrawAmount)
        })
      })
      describe('when one bonus token', function () {
        let vault: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          await bonusToken
            .connect(admin)
            .transfer(rewardPool.address, mockTokenSupply)
          await geyser.connect(admin).registerBonusToken(bonusToken.address)

          vault = await createInstance('UniversalVault', vaultFactory, user)

          await stakingToken
            .connect(admin)
            .transfer(vault.address, depositAmount)

          await deposit(user, geyser, vault, stakingToken, depositAmount)
        })
        describe('with fully vested stake', function () {
          beforeEach(async function () {
            await increaseTime(rewardScaling.time)
          })
          it('should succeed', async function () {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
          })
          it('should update state', async function () {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )

            const geyserData = await geyser.getGeyserData()
            const vaultData = await geyser.getVaultData(vault.address)

            expect(geyserData.rewardSharesOutstanding).to.eq(0)
            expect(geyserData.totalStake).to.eq(0)
            expect(geyserData.totalStakeUnits).to.eq(0)
            expect(geyserData.lastUpdate).to.eq(await getTimestamp())
            expect(vaultData.totalStake).to.eq(0)
            expect(vaultData.stakes.length).to.eq(0)
          })
          it('should emit event', async function () {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vault.address,
                user.address,
                depositAmount,
                rewardAmount,
              )
          })
          it('should transfer tokens', async function () {
            const txPromise = withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, rewardAmount)
            await expect(txPromise)
              .to.emit(bonusToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, mockTokenSupply)
          })
          it('should unlock tokens', async function () {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(vault, 'Unlocked')
              .withArgs(geyser.address, stakingToken.address, depositAmount)
          })
        })
        describe('with partially vested stake', function () {
          const stakeDuration = rewardScaling.time / 2
          const expectedReward = calculateExpectedReward(
            depositAmount,
            stakeDuration,
            rewardAmount,
            0,
          )
          const expectedBonus = calculateExpectedReward(
            depositAmount,
            stakeDuration,
            mockTokenSupply,
            0,
          )
          beforeEach(async function () {
            await increaseTime(stakeDuration)
          })
          it('should succeed', async function () {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
          })
          it('should update state', async function () {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )

            const geyserData = await geyser.getGeyserData()
            const vaultData = await geyser.getVaultData(vault.address)

            expect(geyserData.rewardSharesOutstanding).to.eq(
              rewardAmount.sub(expectedReward).mul(BASE_SHARES_PER_WEI),
            )
            expect(geyserData.totalStake).to.eq(0)
            expect(geyserData.totalStakeUnits).to.eq(0)
            expect(geyserData.lastUpdate).to.eq(await getTimestamp())
            expect(vaultData.totalStake).to.eq(0)
            expect(vaultData.stakes.length).to.eq(0)
          })
          it('should emit event', async function () {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vault.address,
                user.address,
                depositAmount,
                expectedReward,
              )
          })
          it('should transfer tokens', async function () {
            const txPromise = withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, expectedReward)
            await expect(txPromise)
              .to.emit(bonusToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, expectedBonus)
          })
          it('should unlock tokens', async function () {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(vault, 'Unlocked')
              .withArgs(geyser.address, stakingToken.address, depositAmount)
          })
        })
      })
      describe('with multiple vaults', function () {
        const depositAmount = ethers.utils.parseEther('1')
        const rewardAmount = ethers.utils.parseUnits('1000', 9)
        const quantity = 10

        let vaults = [] as Array<Contract>
        beforeEach(async function () {
          // fund geyser
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          // create vaults
          const permissions = []
          for (let index = 0; index < quantity; index++) {
            const vault = await createInstance(
              'UniversalVault',
              vaultFactory,
              user,
            )
            await stakingToken
              .connect(admin)
              .transfer(vault.address, depositAmount)

            vaults.push(vault)

            permissions.push(
              await signPermission(
                'lock',
                user,
                vault,
                geyser.address,
                stakingToken.address,
                depositAmount,
              ),
            )
          }

          // deposit in same block
          const MockStakeHelper = await deployContract('MockStakeHelper')
          await MockStakeHelper.depositBatch(
            new Array(quantity).fill(geyser.address),
            vaults.map((vault) => vault.address),
            new Array(quantity).fill(depositAmount),
            permissions,
          )

          // increase time to end of reward scaling
          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          for (const vault of vaults) {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
          }
        })
        it('should update state', async function () {
          await geyser.connect(admin).registerVaultFactory(vaultFactory.address)
          for (const vault of vaults) {
            await withdraw(
              user,
              user.address,
              geyser,
              vault,
              stakingToken,
              depositAmount,
            )
          }

          const geyserData = await geyser.getGeyserData()

          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
        })
        it('should emit event', async function () {
          for (const vault of vaults) {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vault,
                user.address,
                depositAmount,
                rewardAmount.div(quantity),
              )
          }
        })
        it('should transfer tokens', async function () {
          for (const vault of vaults) {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(rewardToken, 'Transfer')
              .withArgs(
                rewardPool.address,
                user.address,
                rewardAmount.div(quantity),
              )
          }
        })
        it('should unlock tokens', async function () {
          for (const vault of vaults) {
            await expect(
              withdraw(
                user,
                user.address,
                geyser,
                vault,
                stakingToken,
                depositAmount,
              ),
            )
              .to.emit(vault, 'Unlocked')
              .withArgs(geyser.address, stakingToken.address, depositAmount)
          }
        })
      })
    })

    describe('rageQuit', function () {
      const depositAmount = ethers.utils.parseEther('100')
      const rewardAmount = ethers.utils.parseUnits('1000', 9)

      let vault: Contract
      beforeEach(async function () {
        // fund geyser
        await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
        await geyser.connect(admin).fundGeyser(rewardAmount, rewardScaling.time)

        // create vault
        vault = await createInstance('UniversalVault', vaultFactory, user)

        // deposit
        await stakingToken.connect(admin).transfer(vault.address, depositAmount)
        await deposit(user, geyser, vault, stakingToken, depositAmount)
      })
      describe('when offline', function () {
        it('should succeed', async function () {
          await powerSwitch.connect(admin).powerOff()
          // todo
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          // todo
        })
      })
      describe('with invalid vault', function () {
        it('should fail', async function () {
          // todo
        })
      })
      describe('as not vault owner', function () {
        it('should fail', async function () {
          // todo
        })
      })
      describe('with amount of zero', function () {
        it('should fail', async function () {
          // todo
        })
      })
      describe('with invalid recipient', function () {
        describe('of address zero', function () {
          it('should fail', async function () {
            // todo
          })
        })
        describe('of vault address', function () {
          it('should fail', async function () {
            // todo
          })
        })
      })
      describe('when online', function () {
        it('should succeed', async function () {
          // todo
        })
        it('should not update state', async function () {
          // todo
        })
        it('should transfer tokens', async function () {
          // todo
        })
      })
    })
  })
})
