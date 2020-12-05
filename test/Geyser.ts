import { ethers, upgrades } from 'hardhat'
import { BigNumber, BigNumberish, Contract, Signer } from 'ethers'
import {
  HardHatSigner,
  deployContract,
  deployAmpl,
  deployGeyser,
  increaseTime,
  getTimestamp,
  invokeRebase,
} from './utils'

import { expect } from 'chai'

upgrades.silenceWarnings()

describe('Geyser', function () {
  let accounts: HardHatSigner[], admin: HardHatSigner, user: HardHatSigner

  let powerSwitchFactory: Contract,
    rewardPoolFactory: Contract,
    vaultTemplate: Contract,
    stakingToken: Contract,
    rewardToken: Contract,
    bonusToken: Contract

  const mockTokenSupply = ethers.utils.parseEther('1000')
  const BASE_SHARES_PER_WEI = 1000000
  const DAY = 24 * 3600
  const YEAR = 365 * DAY
  const rewardScaling = { floor: 33, ceiling: 100, time: 60 * DAY }

  let amplInitialSupply: BigNumber

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
    vaultTemplate = await deployContract('Vault')
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
          vaultTemplate.address,
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
          vaultTemplate.address,
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
          vaultTemplate.address,
          [rewardScaling.floor, rewardScaling.ceiling, rewardScaling.time],
        ]
        const geyser = await deployGeyser(args)

        const data = await geyser.getGeyserData()

        expect(data.stakingToken).to.eq(stakingToken.address)
        expect(data.rewardToken).to.eq(rewardToken.address)
        expect(data.rewardPool).to.not.eq(ethers.constants.AddressZero)
        expect(data.vaultTemplate).to.eq(vaultTemplate.address)
        expect(data.rewardScaling.floor).to.eq(33)
        expect(data.rewardScaling.ceiling).to.eq(100)
        expect(data.rewardSharesOutstanding).to.eq(0)
        expect(data.totalStake).to.eq(0)
        expect(data.totalStakeUnits).to.eq(0)
        expect(data.lastUpdate).to.eq(0)
        expect(data.rewardSchedules).to.deep.eq([])
        expect(await geyser.getBonusTokenSetLength()).to.eq(0)
        expect(await geyser.getVaultSetLength()).to.eq(0)
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
        vaultTemplate.address,
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
            await stakingToken
              .connect(admin)
              .transfer(user.address, depositAmount)
            await stakingToken
              .connect(user)
              .approve(geyser.address, depositAmount)

            vault = await ethers.getContractAt(
              'Vault',
              await geyser
                .connect(user)
                .callStatic.createVaultAndDeposit(depositAmount),
            )
            await geyser.connect(user).createVaultAndDeposit(depositAmount)

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
              await geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount)
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
              await geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount)
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
        vaultTemplate.address,
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

    describe('createVault', function () {
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(geyser.connect(user).createVault()).to.be.revertedWith(
            'Powered: is not online',
          )
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(geyser.connect(user).createVault()).to.be.revertedWith(
            'Powered: is not online',
          )
        })
      })
      describe('when online', function () {
        describe('for first vault', function () {
          it('should succeed', async function () {
            await geyser.connect(user).createVault()
          })
          it('should update state', async function () {
            await geyser.connect(user).createVault()
            expect(await geyser.getVaultSetLength()).to.eq(1)
            const vault = await ethers.getContractAt(
              'Vault',
              await geyser.getVaultAtIndex(0),
            )
            const vaultData = await geyser.getVaultData(vault.address)
            expect(vaultData.totalStake).to.eq(0)
            expect(vaultData.stakes.length).to.eq(0)
          })
          it('should emit event', async function () {
            await expect(geyser.connect(user).createVault())
              .to.emit(geyser, 'VaultCreated')
              .withArgs(await geyser.getVaultAtIndex(0))
          })
        })
        describe('for second vault', function () {
          beforeEach(async function () {
            await geyser.connect(user).createVault()
          })
          it('should succeed', async function () {
            await geyser.connect(user).createVault()
          })
          it('should update state', async function () {
            await geyser.connect(user).createVault()
            expect(await geyser.getVaultSetLength()).to.eq(2)
            const vault = await ethers.getContractAt(
              'Vault',
              await geyser.getVaultAtIndex(1),
            )
            const vaultData = await geyser.getVaultData(vault.address)
            expect(vaultData.totalStake).to.eq(0)
            expect(vaultData.stakes.length).to.eq(0)
          })
          it('should emit event', async function () {
            await expect(geyser.connect(user).createVault())
              .to.emit(geyser, 'VaultCreated')
              .withArgs(await geyser.getVaultAtIndex(1))
          })
        })
      })
    })

    describe('deposit', function () {
      const depositAmount = mockTokenSupply.div(100)
      let vault: Contract

      beforeEach(async function () {
        await geyser.connect(user).createVault()
        expect(await geyser.getVaultSetLength()).to.eq(1)
        vault = await ethers.getContractAt(
          'Vault',
          await geyser.getVaultAtIndex(0),
        )
        await stakingToken.connect(admin).transfer(user.address, depositAmount)
        await stakingToken.connect(user).approve(geyser.address, depositAmount)
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser.connect(user).deposit(vault.address, depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser.connect(user).deposit(vault.address, depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('to invalid vault', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(user)
              .deposit(ethers.constants.AddressZero, depositAmount),
          ).to.be.revertedWith('Geyser: invalid vault')
        })
      })
      describe('with amount of zero', function () {
        it('should fail', async function () {
          await expect(
            geyser.connect(user).deposit(vault.address, 0),
          ).to.be.revertedWith('Geyser: no amount deposited')
        })
      })
      describe('with insufficient approval', function () {
        it('should fail', async function () {
          await stakingToken.connect(user).approve(geyser.address, 0)
          await expect(
            geyser.connect(user).deposit(vault.address, depositAmount),
          ).to.be.revertedWith('ERC20: transfer amount exceeds allowance')
        })
      })
      describe('with insufficient balance', function () {
        it('should fail', async function () {
          await stakingToken
            .connect(user)
            .transfer(admin.address, depositAmount)
          await expect(
            geyser.connect(user).deposit(vault.address, depositAmount),
          ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
        })
      })
      describe('when not funded', function () {
        it('should succeed', async function () {
          await geyser.connect(user).deposit(vault.address, depositAmount)
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
              await geyser.connect(user).deposit(vault.address, depositAmount)
            })
            it('should update state', async function () {
              await geyser.connect(user).deposit(vault.address, depositAmount)

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
                geyser.connect(user).deposit(vault.address, depositAmount),
              )
                .to.emit(geyser, 'Deposit')
                .withArgs(await geyser.getVaultAtIndex(0), depositAmount)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser.connect(user).deposit(vault.address, depositAmount),
              )
                .to.emit(stakingToken, 'Transfer')
                .withArgs(
                  user.address,
                  await geyser.getVaultAtIndex(0),
                  depositAmount,
                )
            })
          })
          describe('as not vault owner', function () {
            beforeEach(async function () {
              await vault.connect(user).transferOwnership(admin.address)
            })
            it('should succeed', async function () {
              await geyser.connect(user).deposit(vault.address, depositAmount)
            })
            it('should update state', async function () {
              await geyser.connect(user).deposit(vault.address, depositAmount)

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
                geyser.connect(user).deposit(vault.address, depositAmount),
              )
                .to.emit(geyser, 'Deposit')
                .withArgs(await geyser.getVaultAtIndex(0), depositAmount)
            })
            it('should transfer tokens', async function () {
              await expect(
                geyser.connect(user).deposit(vault.address, depositAmount),
              )
                .to.emit(stakingToken, 'Transfer')
                .withArgs(
                  user.address,
                  await geyser.getVaultAtIndex(0),
                  depositAmount,
                )
            })
          })
        })
        describe('on second deposit', function () {
          beforeEach(async function () {
            await geyser
              .connect(user)
              .deposit(vault.address, depositAmount.div(2))
          })
          it('should succeed', async function () {
            await geyser
              .connect(user)
              .deposit(vault.address, depositAmount.div(2))
          })
          it('should update state', async function () {
            await geyser
              .connect(user)
              .deposit(vault.address, depositAmount.div(2))

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
              geyser.connect(user).deposit(vault.address, depositAmount.div(2)),
            )
              .to.emit(geyser, 'Deposit')
              .withArgs(await geyser.getVaultAtIndex(0), depositAmount.div(2))
          })
          it('should transfer tokens', async function () {
            await expect(
              geyser.connect(user).deposit(vault.address, depositAmount.div(2)),
            )
              .to.emit(stakingToken, 'Transfer')
              .withArgs(
                user.address,
                await geyser.getVaultAtIndex(0),
                depositAmount.div(2),
              )
          })
        })
      })
      describe('when deposits reset', function () {
        beforeEach(async function () {
          await geyser.connect(user).deposit(vault.address, depositAmount)
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
        })
        it('should succeed', async function () {
          await geyser.connect(user).deposit(vault.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser.connect(user).deposit(vault.address, depositAmount)

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
            geyser.connect(user).deposit(vault.address, depositAmount),
          )
            .to.emit(geyser, 'Deposit')
            .withArgs(await geyser.getVaultAtIndex(0), depositAmount)
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser.connect(user).deposit(vault.address, depositAmount),
          )
            .to.emit(stakingToken, 'Transfer')
            .withArgs(
              user.address,
              await geyser.getVaultAtIndex(0),
              depositAmount,
            )
        })
      })
    })

    describe('createVaultAndDeposit', function () {
      const depositAmount = mockTokenSupply.div(100)

      beforeEach(async function () {
        await stakingToken.connect(admin).transfer(user.address, depositAmount)
        await stakingToken.connect(user).approve(geyser.address, depositAmount)
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser.connect(user).createVaultAndDeposit(depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser.connect(user).createVaultAndDeposit(depositAmount),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when online', function () {
        it('should succeed', async function () {
          await geyser.connect(user).createVaultAndDeposit(depositAmount)
        })
        it('should update state', async function () {
          const vault = await ethers.getContractAt(
            'Vault',
            await geyser
              .connect(user)
              .callStatic.createVaultAndDeposit(depositAmount),
          )
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          expect(await geyser.getVaultAtIndex(0)).to.eq(vault.address)

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
          const txPromise = geyser
            .connect(user)
            .createVaultAndDeposit(depositAmount)
          await expect(txPromise)
            .to.emit(geyser, 'VaultCreated')
            .withArgs(await geyser.getVaultAtIndex(0))
          await expect(txPromise)
            .to.emit(geyser, 'Deposit')
            .withArgs(await geyser.getVaultAtIndex(0), depositAmount)
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser.connect(user).createVaultAndDeposit(depositAmount),
          )
            .to.emit(stakingToken, 'Transfer')
            .withArgs(
              user.address,
              await geyser.getVaultAtIndex(0),
              depositAmount,
            )
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(rewardScaling.time)
        })
        describe('when offline', function () {
          it('should fail', async function () {
            await powerSwitch.connect(admin).powerOff()
            await expect(
              geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount),
            ).to.be.revertedWith('Powered: is not online')
          })
        })
        describe('when shutdown', function () {
          it('should fail', async function () {
            await powerSwitch.connect(admin).emergencyShutdown()
            await expect(
              geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount),
            ).to.be.revertedWith('Powered: is not online')
          })
        })
        describe('with invalid vault', function () {
          it('should fail', async function () {
            await expect(
              geyser
                .connect(user)
                .withdraw(user.address, user.address, depositAmount),
            ).to.be.revertedWith('Geyser: invalid vault')
          })
        })
        describe('as not vault owner', function () {
          it('should fail', async function () {
            await expect(
              geyser
                .connect(admin)
                .withdraw(vault.address, user.address, depositAmount),
            ).to.be.revertedWith('Geyser: only vault owner')
          })
        })
        describe('with invalid recipient', function () {
          describe('of vault', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(vault.address, vault.address, depositAmount),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of geyser', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(vault.address, geyser.address, depositAmount),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of address(0)', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(
                    vault.address,
                    ethers.constants.AddressZero,
                    depositAmount,
                  ),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of staking token', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(vault.address, stakingToken.address, depositAmount),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of reward token', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(vault.address, rewardToken.address, depositAmount),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
          describe('of reward pool', function () {
            it('should fail', async function () {
              await expect(
                geyser
                  .connect(user)
                  .withdraw(vault.address, rewardPool.address, depositAmount),
              ).to.be.revertedWith('Geyser: invalid address')
            })
          })
        })
        describe('with amount of zero', function () {
          it('should fail', async function () {
            await expect(
              geyser.connect(user).withdraw(vault.address, user.address, 0),
            ).to.be.revertedWith('Geyser: no amount withdrawn')
          })
        })
        describe('with amount greater than deposits', function () {
          it('should fail', async function () {
            await expect(
              geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount.add(1)),
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(vault.address, user.address, depositAmount, rewardAmount)
        })
        it('should transfer tokens', async function () {
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, rewardAmount)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(stakeDuration)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
        })
      })
      describe('with no reward', function () {
        const expectedReward = 0

        let vault: Contract
        beforeEach(async function () {
          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
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
          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(rewardScaling.time)

          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time / 2)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
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

          vault = await ethers.getContractAt(
            'Vault',
            await geyser.connect(user).callStatic.createVault(),
          )
          await geyser.connect(user).createVault()

          MockStakeHelper = await (
            await (
              await ethers.getContractFactory('MockStakeHelper', user)
            ).deploy()
          ).deployed()

          await vault.connect(user).transferOwnership(MockStakeHelper.address)

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(MockStakeHelper.address, depositAmount)
        })
        it('should succeed', async function () {
          await MockStakeHelper.connect(user).flashStake(
            vault.address,
            depositAmount,
          )
        })
        it('should update state', async function () {
          await MockStakeHelper.connect(user).flashStake(
            vault.address,
            depositAmount,
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
            MockStakeHelper.connect(user).flashStake(
              vault.address,
              depositAmount,
            ),
          )
            .to.emit(geyser, 'Withdraw')
            .withArgs(vault.address, user.address, depositAmount, 0)
        })
        it('should transfer tokens', async function () {
          const txPromise = MockStakeHelper.connect(user).flashStake(
            vault.address,
            depositAmount,
          )
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, 0)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(stakeDuration)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount.div(2))
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount.div(2))

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount.div(2)),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, depositAmount.div(2))
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount.div(2))
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

        let vault: Contract, MockStakeHelper: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await ethers.getContractAt(
            'Vault',
            await geyser.connect(user).callStatic.createVault(),
          )
          await geyser.connect(user).createVault()

          MockStakeHelper = await (
            await (
              await ethers.getContractFactory('MockStakeHelper', user)
            ).deploy()
          ).deployed()

          await stakingToken
            .connect(admin)
            .transfer(user.address, currentDeposit)
          await stakingToken
            .connect(user)
            .approve(MockStakeHelper.address, currentDeposit)

          await MockStakeHelper.multiStake(
            vault.address,
            currentDeposit.div(3),
            3,
          )

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, withdrawAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, withdrawAmount)
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

        let vault: Contract, MockStakeHelper: Contract
        beforeEach(async function () {
          await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
          await geyser
            .connect(admin)
            .fundGeyser(rewardAmount, rewardScaling.time)

          await increaseTime(rewardScaling.time)

          vault = await ethers.getContractAt(
            'Vault',
            await geyser.connect(user).callStatic.createVault(),
          )
          await geyser.connect(user).createVault()

          MockStakeHelper = await (
            await (
              await ethers.getContractFactory('MockStakeHelper', user)
            ).deploy()
          ).deployed()

          await stakingToken
            .connect(admin)
            .transfer(user.address, currentDeposit)
          await stakingToken
            .connect(user)
            .approve(MockStakeHelper.address, currentDeposit)

          await MockStakeHelper.multiStake(
            vault.address,
            currentDeposit.div(3),
            3,
          )

          await increaseTime(rewardScaling.time)
        })
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)
        })
        it('should update state', async function () {
          await geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)

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
            geyser
              .connect(user)
              .withdraw(vault.address, user.address, withdrawAmount),
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
          const txPromise = geyser
            .connect(user)
            .withdraw(vault.address, user.address, withdrawAmount)
          await expect(txPromise)
            .to.emit(rewardToken, 'Transfer')
            .withArgs(rewardPool.address, user.address, expectedReward)
          await expect(txPromise)
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, withdrawAmount)
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

          await stakingToken
            .connect(admin)
            .transfer(user.address, depositAmount)
          await stakingToken
            .connect(user)
            .approve(geyser.address, depositAmount)
          await geyser.connect(user).createVaultAndDeposit(depositAmount)

          expect(await geyser.getVaultSetLength()).to.eq(1)
          vault = await ethers.getContractAt(
            'Vault',
            await geyser.getVaultAtIndex(0),
          )
        })
        describe('with fully vested stake', function () {
          beforeEach(async function () {
            await increaseTime(rewardScaling.time)
          })
          it('should succeed', async function () {
            await geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)
          })
          it('should update state', async function () {
            await geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)

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
              geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount),
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
            const txPromise = geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, rewardAmount)
            await expect(txPromise)
              .to.emit(bonusToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, mockTokenSupply)
            await expect(txPromise)
              .to.emit(stakingToken, 'Transfer')
              .withArgs(vault.address, user.address, depositAmount)
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
            await geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)
          })
          it('should update state', async function () {
            await geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)

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
              geyser
                .connect(user)
                .withdraw(vault.address, user.address, depositAmount),
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
            const txPromise = geyser
              .connect(user)
              .withdraw(vault.address, user.address, depositAmount)
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, expectedReward)
            await expect(txPromise)
              .to.emit(bonusToken, 'Transfer')
              .withArgs(rewardPool.address, user.address, expectedBonus)
            await expect(txPromise)
              .to.emit(stakingToken, 'Transfer')
              .withArgs(vault.address, user.address, depositAmount)
          })
        })
      })
    })

    describe('withdrawMulti', function () {
      const depositAmount = ethers.utils.parseEther('1')
      const rewardAmount = ethers.utils.parseUnits('1000', 9)
      const quantity = 10
      let MockStakeHelper: Contract
      let vaults: string[]
      beforeEach(async function () {
        await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
        await geyser.connect(admin).fundGeyser(rewardAmount, rewardScaling.time)

        await increaseTime(rewardScaling.time)

        MockStakeHelper = await (
          await (
            await ethers.getContractFactory('MockStakeHelper', user)
          ).deploy()
        ).deployed()

        await stakingToken
          .connect(admin)
          .transfer(user.address, depositAmount.mul(quantity))
        await stakingToken
          .connect(user)
          .approve(MockStakeHelper.address, depositAmount.mul(quantity))

        vaults = await MockStakeHelper.connect(
          user,
        ).callStatic.multiCreateAndDeposit(geyser.address, depositAmount)
        await MockStakeHelper.connect(user).multiCreateAndDeposit(
          geyser.address,
          depositAmount,
        )

        await increaseTime(rewardScaling.time)
      })
      describe('when online', function () {
        it('should succeed', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
        })
        it('should update state', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )

          const geyserData = await geyser.getGeyserData()

          expect(await geyser.getVaultSetLength()).to.eq(quantity)
          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
        })
        it('should emit event', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vaults[index],
                user.address,
                depositAmount,
                rewardAmount.div(quantity),
              )
          }
        })
        it('should transfer tokens', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(
                rewardPool.address,
                user.address,
                rewardAmount.div(quantity),
              )
            await expect(txPromise)
              .to.emit(stakingToken, 'Transfer')
              .withArgs(vaults[index], user.address, depositAmount)
          }
        })
      })
      describe('with positive rebase of 200%', function () {
        beforeEach(async function () {
          // rebase of 100 doubles the inital supply
          await invokeRebase(rewardToken, 100, admin)
        })
        it('should succeed', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
        })
        it('should update state', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )

          const geyserData = await geyser.getGeyserData()

          expect(await geyser.getVaultSetLength()).to.eq(quantity)
          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
        })
        it('should emit event', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vaults[index],
                user.address,
                depositAmount,
                rewardAmount.mul(2).div(quantity),
              )
          }
        })
        it('should transfer tokens', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(
                rewardPool.address,
                user.address,
                rewardAmount.mul(2).div(quantity),
              )
            await expect(txPromise)
              .to.emit(stakingToken, 'Transfer')
              .withArgs(vaults[index], user.address, depositAmount)
          }
        })
      })
      describe('with negative rebase of 50%', function () {
        beforeEach(async function () {
          // rebase of -50 halves the inital supply
          await invokeRebase(rewardToken, -50, admin)
        })
        it('should succeed', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
        })
        it('should update state', async function () {
          await geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )

          const geyserData = await geyser.getGeyserData()

          expect(await geyser.getVaultSetLength()).to.eq(quantity)
          expect(geyserData.rewardSharesOutstanding).to.eq(0)
          expect(geyserData.totalStake).to.eq(0)
          expect(geyserData.totalStakeUnits).to.eq(0)
          expect(geyserData.lastUpdate).to.eq(await getTimestamp())
        })
        it('should emit event', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(geyser, 'Withdraw')
              .withArgs(
                vaults[index],
                user.address,
                depositAmount,
                rewardAmount.div(2).div(quantity),
              )
          }
        })
        it('should transfer tokens', async function () {
          let txPromise = geyser.connect(user).withdrawMulti(
            vaults,
            vaults.map(() => user.address),
            vaults.map(() => depositAmount),
          )
          for (let index = 0; index < vaults.length; index++) {
            await expect(txPromise)
              .to.emit(rewardToken, 'Transfer')
              .withArgs(
                rewardPool.address,
                user.address,
                rewardAmount.div(2).div(quantity),
              )
            await expect(txPromise)
              .to.emit(stakingToken, 'Transfer')
              .withArgs(vaults[index], user.address, depositAmount)
          }
        })
      })
      describe('when offline', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser.connect(user).withdrawMulti(
              vaults,
              vaults.map(() => user.address),
              vaults.map(() => depositAmount),
            ),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser.connect(user).withdrawMulti(
              vaults,
              vaults.map(() => user.address),
              vaults.map(() => depositAmount),
            ),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when invalid input length amount', function () {
        it('should fail', async function () {
          await expect(
            geyser.connect(user).withdrawMulti(
              vaults,
              vaults.map(() => user.address),
              [depositAmount],
            ),
          ).to.be.revertedWith('Geyser: wrong input array length')
        })
      })
      describe('when invalid input length recipients', function () {
        it('should fail', async function () {
          await expect(
            geyser.connect(user).withdrawMulti(
              vaults,
              [user.address],
              vaults.map(() => depositAmount),
            ),
          ).to.be.revertedWith('Geyser: wrong input array length')
        })
      })
    })

    describe('rescueStakingTokensFromVault', function () {
      const depositAmount = ethers.utils.parseEther('100')
      const rewardAmount = ethers.utils.parseUnits('1000', 9)

      let vault: Contract
      beforeEach(async function () {
        await rewardToken.connect(admin).approve(geyser.address, rewardAmount)
        await geyser.connect(admin).fundGeyser(rewardAmount, rewardScaling.time)

        await stakingToken.connect(admin).transfer(user.address, depositAmount)
        await stakingToken.connect(user).approve(geyser.address, depositAmount)
        await geyser.connect(user).createVaultAndDeposit(depositAmount)

        expect(await geyser.getVaultSetLength()).to.eq(1)
        vault = await ethers.getContractAt(
          'Vault',
          await geyser.getVaultAtIndex(0),
        )

        await stakingToken.connect(admin).transfer(vault.address, depositAmount)
      })
      describe('when offline', function () {
        it('should succeed', async function () {
          await powerSwitch.connect(admin).powerOff()
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(vault.address, user.address),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('when shutdown', function () {
        it('should fail', async function () {
          await powerSwitch.connect(admin).emergencyShutdown()
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(vault.address, user.address),
          ).to.be.revertedWith('Powered: is not online')
        })
      })
      describe('with invalid vault', function () {
        it('should fail', async function () {
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(user.address, user.address),
          ).to.be.revertedWith('Geyser: invalid vault')
        })
      })
      describe('as not vault owner', function () {
        it('should fail', async function () {
          await vault.connect(user).transferOwnership(admin.address)
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(vault.address, user.address),
          ).to.be.revertedWith('Geyser: only vault owner')
        })
      })
      describe('with amount of zero', function () {
        it('should fail', async function () {
          await geyser
            .connect(user)
            .rescueStakingTokensFromVault(vault.address, user.address)
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(vault.address, user.address),
          ).to.be.revertedWith('Geyser: no tokens to rescue')
        })
      })
      describe('with invalid recipient', function () {
        describe('of address zero', function () {
          it('should fail', async function () {
            await expect(
              geyser
                .connect(user)
                .rescueStakingTokensFromVault(
                  vault.address,
                  ethers.constants.AddressZero,
                ),
            ).to.be.revertedWith('Geyser: invalid address')
          })
        })
        describe('of vault address', function () {
          it('should fail', async function () {
            await expect(
              geyser
                .connect(user)
                .rescueStakingTokensFromVault(vault.address, vault.address),
            ).to.be.revertedWith('Geyser: invalid address')
          })
        })
      })
      describe('when online', function () {
        it('should succeed', async function () {
          await geyser
            .connect(user)
            .rescueStakingTokensFromVault(vault.address, user.address)
        })
        it('should not update state', async function () {
          await geyser
            .connect(user)
            .rescueStakingTokensFromVault(vault.address, user.address)

          const vaultData = await geyser.getVaultData(vault.address)
          expect(vaultData.totalStake).to.eq(depositAmount)
        })
        it('should transfer tokens', async function () {
          await expect(
            geyser
              .connect(user)
              .rescueStakingTokensFromVault(vault.address, user.address),
          )
            .to.emit(stakingToken, 'Transfer')
            .withArgs(vault.address, user.address, depositAmount)
        })
      })
    })
  })
})
