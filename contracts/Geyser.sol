// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {IUniversalVault} from "./UniversalVault.sol";
import {IRewardPool} from "./RewardPool.sol";
import {IFactory} from "./Factory/IFactory.sol";
import {IRageQuit} from "./UniversalVault.sol";

import {Powered} from "./PowerSwitch/Powered.sol";

interface IGeyser is IRageQuit {
    struct GeyserData {
        address stakingToken;
        address rewardToken;
        address rewardPool;
        RewardScaling rewardScaling;
        uint256 rewardSharesOutstanding;
        uint256 totalStake;
        uint256 totalStakeUnits;
        uint256 lastUpdate;
        RewardSchedule[] rewardSchedules;
    }

    struct RewardSchedule {
        uint256 duration;
        uint256 start;
        uint256 shares;
    }

    struct VaultData {
        uint256 totalStake;
        StakeData[] stakes;
    }

    struct StakeData {
        uint256 amount;
        uint256 timestamp;
    }

    struct RewardScaling {
        uint256 floor;
        uint256 ceiling;
        uint256 time;
    }

    function getGeyserData() external view returns (GeyserData memory geyser);

    function getVaultData(address vault) external view returns (VaultData memory vaultData);

    function deposit(
        address vault,
        uint256 amount,
        bytes calldata permission
    ) external;

    function withdraw(
        address vault,
        address recipient,
        uint256 amount,
        bytes calldata permission
    ) external;
}

/// @title Geyser
/// @notice Reward distribution contract with time multiplier
/// @dev Security contact: dev-support@ampleforth.org
contract Geyser is IGeyser, Powered, OwnableUpgradeable {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    /* constants */

    uint256 public constant BASE_SHARES_PER_WEI = 1000000;
    // With 30 deposits, ragequit costs 432811 gas
    uint256 public constant MAX_STAKES_PER_VAULT = 30;

    /* storage */

    address private _vaultFactory;
    GeyserData private _geyser;
    mapping(address => VaultData) private _vaults;
    EnumerableSet.AddressSet private _bonusTokenSet;
    EnumerableSet.AddressSet private _vaultFactorySet;

    /* admin events */

    event GeyserCreated(address rewardPool, address powerSwitch);
    event GeyserFunded(uint256 amount, uint256 duration);
    event BonusTokenRegistered(address token);
    event VaultFactoryRegistered(address factory);
    event VaultFactoryRemoved(address factory);

    /* user events */

    event VaultCreated(address vault);
    event Deposit(address vault, uint256 amount);
    event Withdraw(address vault, address recipient, uint256 amount, uint256 reward);

    /* initializer */

    /// @notice Initizalize geyser
    /// access control: only proxy constructor
    /// state machine: can only be called once
    /// state scope: set initialization variables
    /// token transfer: none
    /// @param owner address The admin address
    /// @param rewardPoolFactory address The factory to use for deploying the RewardPool
    /// @param powerSwitchFactory address The factory to use for deploying the PowerSwitch
    /// @param stakingToken address The address of the staking token for this geyser
    /// @param rewardToken address The address of the reward token for this geyser
    /// @param rewardScaling RewardScaling The config for reward scaling floor, ceiling, and time
    function initialize(
        address owner,
        address rewardPoolFactory,
        address powerSwitchFactory,
        address stakingToken,
        address rewardToken,
        RewardScaling calldata rewardScaling
    ) external initializer {
        // the scaling floor must be smaller than ceiling
        require(rewardScaling.floor <= rewardScaling.ceiling, "Geyser: floor above ceiling");

        // setting rewardScalingTime to 0 would cause divide by zero error
        // to disable reward scaling, use rewardScalingFloor == rewardScalingCeiling
        require(rewardScaling.time != 0, "Geyser: scaling time cannot be zero");

        // deploy power switch
        address powerSwitch = IFactory(powerSwitchFactory).create(abi.encode(owner));

        // deploy reward pool
        address rewardPool = IFactory(rewardPoolFactory).create(abi.encode(powerSwitch));

        // set internal configs
        OwnableUpgradeable.__Ownable_init();
        OwnableUpgradeable.transferOwnership(owner);
        Powered._setPowerSwitch(powerSwitch);

        // commit to storage
        _geyser.stakingToken = stakingToken;
        _geyser.rewardToken = rewardToken;
        _geyser.rewardPool = rewardPool;
        _geyser.rewardScaling = rewardScaling;

        // emit event
        emit GeyserCreated(rewardPool, powerSwitch);
    }

    /* getter functions */

    function getGeyserData() external view override returns (GeyserData memory geyser) {
        return _geyser;
    }

    function getBonusTokenSetLength() external view returns (uint256 length) {
        return _bonusTokenSet.length();
    }

    function getBonusTokenAtIndex(uint256 index) external view returns (address bonusToken) {
        return _bonusTokenSet.at(index);
    }

    function getVaultFactorySetLength() external view returns (uint256 length) {
        return _vaultFactorySet.length();
    }

    function getVaultFactoryAtIndex(uint256 index) external view returns (address factory) {
        return _vaultFactorySet.at(index);
    }

    function getVaultData(address vault)
        external
        view
        override
        returns (VaultData memory vaultData)
    {
        return _vaults[vault];
    }

    function isValidAddress(address target) public view returns (bool validity) {
        // sanity check target for potential input errors
        return
            target != address(this) &&
            target != address(0) &&
            target != _geyser.stakingToken &&
            target != _geyser.rewardToken &&
            target != _geyser.rewardPool &&
            !_bonusTokenSet.contains(target);
    }

    function isValidVault(address target) public view returns (bool validity) {
        // validate target is created from whitelisted vault factory
        for (uint256 index = 0; index < _vaultFactorySet.length(); index++) {
            if (IFactory(_vaultFactorySet.at(index)).created(target)) {
                return true;
            }
        }
        // explicit return
        return false;
    }

    function getRewardAvailable() public view returns (uint256 rewardAvailable) {
        // get reward amount remaining
        uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);

        // calculate reward available based on state
        rewardAvailable = calculateRewardAvailable(
            _geyser.rewardSchedules,
            rewardRemaining,
            _geyser.rewardSharesOutstanding,
            block.timestamp
        );

        // explicit return
        return rewardAvailable;
    }

    function getFutureRewardAvailable(uint256 timestamp)
        public
        view
        returns (uint256 rewardAvailable)
    {
        // get reward amount remaining
        uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);

        // calculate reward available based on state
        rewardAvailable = calculateRewardAvailable(
            _geyser.rewardSchedules,
            rewardRemaining,
            _geyser.rewardSharesOutstanding,
            timestamp
        );

        // explicit return
        return rewardAvailable;
    }

    function getVaultReward(address vault) external view returns (uint256 reward) {
        // calculate rewards
        (, reward, ) = calculateRewardMulti(
            _vaults[vault].stakes,
            _vaults[vault].totalStake,
            getRewardAvailable(),
            getTotalStakeUnits(),
            block.timestamp,
            _geyser.rewardScaling
        );
        // explicit return
        return reward;
    }

    function getStakeReward(address vault, uint256 stakeAmount)
        external
        view
        returns (uint256 reward)
    {
        // calculate rewards
        (, reward, ) = calculateRewardMulti(
            _vaults[vault].stakes,
            stakeAmount,
            getRewardAvailable(),
            getTotalStakeUnits(),
            block.timestamp,
            _geyser.rewardScaling
        );
        // explicit return
        return reward;
    }

    function getFutureVaultReward(address vault, uint256 timestamp)
        external
        view
        returns (uint256 reward)
    {
        // calculate rewards
        (, reward, ) = calculateRewardMulti(
            _vaults[vault].stakes,
            _vaults[vault].totalStake,
            getFutureRewardAvailable(timestamp),
            getFutureTotalStakeUnits(timestamp),
            timestamp,
            _geyser.rewardScaling
        );
        // explicit return
        return reward;
    }

    function getFutureStakeReward(
        address vault,
        uint256 stakeAmount,
        uint256 timestamp
    ) external view returns (uint256 reward) {
        // calculate rewards
        (, reward, ) = calculateRewardMulti(
            _vaults[vault].stakes,
            stakeAmount,
            getFutureRewardAvailable(timestamp),
            getFutureTotalStakeUnits(timestamp),
            timestamp,
            _geyser.rewardScaling
        );
        // explicit return
        return reward;
    }

    function getTotalStakeUnits() public view returns (uint256 totalStakeUnits) {
        // calculate new stake units
        uint256 newStakeUnits =
            calculateStakeUnits(_geyser.totalStake, _geyser.lastUpdate, block.timestamp);
        // add to cached total
        totalStakeUnits = _geyser.totalStakeUnits.add(newStakeUnits);
        // explicit return
        return totalStakeUnits;
    }

    function getFutureTotalStakeUnits(uint256 timestamp)
        public
        view
        returns (uint256 totalStakeUnits)
    {
        // calculate new stake units
        uint256 newStakeUnits =
            calculateStakeUnits(_geyser.totalStake, _geyser.lastUpdate, timestamp);
        // add to cached total
        totalStakeUnits = _geyser.totalStakeUnits.add(newStakeUnits);
        // explicit return
        return totalStakeUnits;
    }

    /* pure functions */

    function calculateTotalStakeUnits(StakeData[] memory stakes, uint256 timestamp)
        public
        pure
        returns (uint256 totalStakeUnits)
    {
        for (uint256 index; index < stakes.length; index++) {
            // reference stake
            StakeData memory stake = stakes[index];

            // calculate stake units
            uint256 stakeUnits = calculateStakeUnits(stake.amount, stake.timestamp, timestamp);

            // add to running total
            totalStakeUnits = totalStakeUnits.add(stakeUnits);
        }
    }

    function calculateStakeUnits(
        uint256 amount,
        uint256 start,
        uint256 end
    ) public pure returns (uint256 stakeUnits) {
        // calculate duration
        uint256 duration = end.sub(start);
        // calculate stake units
        stakeUnits = duration.mul(amount);
        // explicit return
        return stakeUnits;
    }

    function calculateRewardAvailable(
        RewardSchedule[] memory rewardSchedules,
        uint256 rewardBalance,
        uint256 sharesOutstanding,
        uint256 timestamp
    ) public pure returns (uint256 rewardAvailable) {
        // return 0 if no registered schedules
        if (rewardSchedules.length == 0) {
            return 0;
        }

        // calculate reward shares locked across all reward schedules
        uint256 sharesLocked;
        for (uint256 index = 0; index < rewardSchedules.length; index++) {
            // fetch reward schedule storage reference
            RewardSchedule memory schedule = rewardSchedules[index];

            // caculate amount of shares available on this schedule
            // if (now - start) >= duration
            //   sharesLocked = 0
            // else
            //   sharesLocked = shares - (shares * (now - start) / duration)
            uint256 currentSharesLocked;
            if (timestamp.sub(schedule.start) >= schedule.duration) {
                currentSharesLocked = 0;
            } else {
                currentSharesLocked = schedule.shares.sub(
                    schedule.shares.mul(timestamp.sub(schedule.start)).div(schedule.duration)
                );
            }

            // add to running total
            sharesLocked = sharesLocked.add(currentSharesLocked);
        }

        // convert shares to reward
        // rewardLocked = sharesLocked * rewardBalance / sharesOutstanding
        uint256 rewardLocked = sharesLocked.mul(rewardBalance).div(sharesOutstanding);

        // calculate amount available
        // rewardAvailable = rewardBalance - rewardLocked
        rewardAvailable = rewardBalance.sub(rewardLocked);

        // explicit return
        return rewardAvailable;
    }

    function calculateRewardMulti(
        StakeData[] memory stakes,
        uint256 amountToWithdraw,
        uint256 rewardAvailable,
        uint256 totalStakeUnits,
        uint256 timestamp,
        RewardScaling memory rewardScaling
    )
        public
        pure
        returns (
            StakeData[] memory newStakes,
            uint256 reward,
            uint256 newTotalStakeUnits
        )
    {
        while (amountToWithdraw > 0) {
            // validate array length
            require(stakes.length > 0, "Geyser: no stakes in array");

            // fetch vault stake storage reference
            StakeData memory lastStake = stakes[stakes.length.sub(1)];

            // calculate stake duration
            uint256 stakeDuration = timestamp.sub(lastStake.timestamp);

            uint256 currentAmount;
            if (lastStake.amount > amountToWithdraw) {
                // set current amount to remaining withdrawl amount
                currentAmount = amountToWithdraw;
                // amount of last stake is reduced
                lastStake.amount = lastStake.amount.sub(amountToWithdraw);
            } else {
                // set current amount to amount of last stake
                currentAmount = lastStake.amount;
                // last stake is removed
                stakes = _truncateStakesArray(stakes, stakes.length - 1);
            }

            // update remaining amountToWithdraw
            amountToWithdraw = amountToWithdraw.sub(currentAmount);

            // calculate reward amount
            uint256 currentReward =
                calculateReward(
                    rewardAvailable,
                    currentAmount,
                    stakeDuration,
                    totalStakeUnits,
                    rewardScaling
                );

            // update cumulative reward
            reward = reward.add(currentReward);

            // update cached rewardAvailable
            rewardAvailable = rewardAvailable.sub(currentReward);

            // calculate time weighted stake
            uint256 stakeUnits = currentAmount.mul(stakeDuration);

            // update cached totalStakeUnits
            totalStakeUnits = totalStakeUnits.sub(stakeUnits);
        }

        // explicit return
        return (stakes, reward, totalStakeUnits);
    }

    function calculateReward(
        uint256 rewardAvailable,
        uint256 stakeAmount,
        uint256 stakeDuration,
        uint256 totalStakeUnits,
        RewardScaling memory rewardScaling
    ) public pure returns (uint256 reward) {
        // calculate time weighted stake
        uint256 stakeUnits = stakeAmount.mul(stakeDuration);

        // calculate base reward
        // baseReward = rewardAvailable * stakeUnits / totalStakeUnits
        uint256 baseReward;
        if (totalStakeUnits == 0) {
            // handle edge case where flash stake on first stake
            baseReward = 0;
        } else {
            // scale reward according to proportional weight
            baseReward = rewardAvailable.mul(stakeUnits).div(totalStakeUnits);
        }

        // calculate scaled reward
        // if no scaling or scaling period completed
        //   reward = baseReward
        // else
        //   minReward = baseReward * scalingFloor / scalingCeiling
        //   bonusReward = baseReward
        //                 * (scalingCeiling - scalingFloor) / scalingCeiling
        //                 * duration / scalingTime
        //   reward = minReward + bonusReward
        if (stakeDuration >= rewardScaling.time || rewardScaling.floor == rewardScaling.ceiling) {
            // no reward scaling applied
            reward = baseReward;
        } else {
            // calculate minimum reward using scaling floor
            uint256 minReward = baseReward.mul(rewardScaling.floor).div(rewardScaling.ceiling);

            // calculate bonus reward with vested portion of scaling factor
            uint256 bonusReward =
                baseReward
                    .mul(stakeDuration)
                    .mul(rewardScaling.ceiling.sub(rewardScaling.floor))
                    .div(rewardScaling.ceiling)
                    .div(rewardScaling.time);

            // add minimum reward and bonus reward
            reward = minReward.add(bonusReward);
        }

        // explicit return
        return reward;
    }

    /* admin functions */

    /// @notice Add funds to the geyser
    /// access control: only admin
    /// state machine:
    ///   - can be called multiple times
    ///   - only online
    /// state scope:
    ///   - increase _geyser.rewardSharesOutstanding
    ///   - append to _geyser.rewardSchedules
    /// token transfer: transfer staking tokens from msg.sender to reward pool
    /// @param amount uint256 Amount of reward tokens to deposit in geyser
    /// @param duration uint256 Duration over which to linearly unlock rewards
    function fundGeyser(uint256 amount, uint256 duration) external onlyOwner onlyOnline {
        // validate duration
        require(duration != 0, "Geyser: invalid duration");

        // create new reward shares
        // if existing rewards on this geyser
        //   mint new shares proportional to % change in rewards remaining
        //   newShares = remainingShares * newReward / rewardRemaining
        // else
        //   mint new shares with BASE_SHARES_PER_WEI initial conversion rate
        //   store as fixed point number with same  of decimals as reward token
        uint256 newRewardShares;
        if (_geyser.rewardSharesOutstanding > 0) {
            uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);
            newRewardShares = _geyser.rewardSharesOutstanding.mul(amount).div(rewardRemaining);
        } else {
            newRewardShares = amount.mul(BASE_SHARES_PER_WEI);
        }

        // add reward shares to total
        _geyser.rewardSharesOutstanding = _geyser.rewardSharesOutstanding.add(newRewardShares);

        // store new reward schedule
        _geyser.rewardSchedules.push(RewardSchedule(duration, block.timestamp, newRewardShares));

        // transfer reward tokens to reward pool
        require(
            IERC20(_geyser.rewardToken).transferFrom(msg.sender, _geyser.rewardPool, amount),
            "Geyser: transfer to reward pool failed"
        );

        // emit event
        emit GeyserFunded(amount, duration);
    }

    /// @notice Add vault factory to whitelist
    /// @dev use this function to enable deposits to vaults coming from the specified
    ///      factory contract
    /// access control: only admin
    /// state machine:
    ///   - can be called multiple times
    ///   - not shutdown
    /// state scope:
    ///   - append to _vaultFactorySet
    /// token transfer: none
    /// @param factory address The address of the vault factory
    function registerVaultFactory(address factory) external onlyOwner notShutdown {
        // add factory to set
        require(_vaultFactorySet.add(factory), "Geyser: vault factory already registered");

        // emit event
        emit VaultFactoryRegistered(factory);
    }

    /// @notice Remove vault factory from whitelist
    /// @dev use this function to disable new deposits to vaults coming from the specified
    ///      factory contract.
    ///      note: vaults with existing deposits from this factory are sill able to withdraw
    /// access control: only admin
    /// state machine:
    ///   - can be called multiple times
    ///   - not shutdown
    /// state scope:
    ///   - remove from _vaultFactorySet
    /// token transfer: none
    /// @param factory address The address of the vault factory
    function removeVaultFactory(address factory) external onlyOwner notShutdown {
        // remove factory from set
        require(_vaultFactorySet.remove(factory), "Geyser: vault factory not registered");

        // emit event
        emit VaultFactoryRemoved(factory);
    }

    /// @notice Register bonus token for distribution
    /// @dev use this function to enable distribution of any ERC20 held by the RewardPool contract
    /// access control: only admin
    /// state machine:
    ///   - can be called multiple times
    ///   - only online
    /// state scope:
    ///   - append to _bonusTokenSet
    /// token transfer: none
    /// @param bonusToken address The address of the bonus token
    function registerBonusToken(address bonusToken) external onlyOwner onlyOnline {
        // verify valid bonus token
        _validateAddress(bonusToken);

        // add token to set
        assert(_bonusTokenSet.add(bonusToken));

        // emit event
        emit BonusTokenRegistered(bonusToken);
    }

    /// @notice Rescue tokens from RewardPool
    /// @dev use this function to rescue tokens from RewardPool contract
    ///      without distributing to stakers or triggering emergency shutdown
    /// access control: only admin
    /// state machine:
    ///   - can be called multiple times
    ///   - only online
    /// state scope: none
    /// token transfer: transfer requested token from RewardPool to recipient
    /// @param token address The address of the token to rescue
    /// @param recipient address The address of the recipient
    /// @param amount uint256 The amount of tokens to rescue
    function rescueTokensFromRewardPool(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner onlyOnline {
        // verify recipient
        _validateAddress(recipient);

        // check not attempting to withdraw reward token
        require(token != _geyser.rewardToken, "Geyser: invalid address");

        // check not attempting to wthdraw bonus token
        require(!_bonusTokenSet.contains(token), "Geyser: invalid address");

        // transfer tokens to recipient
        IRewardPool(_geyser.rewardPool).sendERC20(token, recipient, amount);
    }

    /* user functions */

    /// @notice Deposit staking tokens
    /// @dev anyone can deposit to any vault
    /// access control: anyone
    /// state machine:
    ///   - can be called multiple times
    ///   - only online
    ///   - when vault exists on this geyser
    /// state scope:
    ///   - append to _vaults[vault].stakes
    ///   - increase _vaults[vault].totalStake
    ///   - increase _geyser.totalStake
    ///   - increase _geyser.totalStakeUnits
    ///   - increase _geyser.lastUpdate
    /// token transfer: transfer staking tokens from msg.sender to vault
    /// @param vault address The address of the vault to deposit to
    /// @param amount uint256 The amount of staking tokens to deposit
    function deposit(
        address vault,
        uint256 amount,
        bytes calldata permission
    ) public override onlyOnline {
        // verify vault is valid
        require(isValidVault(vault), "Geyser: vault is not registered");

        // verify non-zero amount
        require(amount != 0, "Geyser: no amount deposited");

        // fetch vault storage reference
        VaultData storage vaultData = _vaults[vault];

        // verify stakes boundary not reached
        require(
            vaultData.stakes.length < MAX_STAKES_PER_VAULT,
            "Geyser: MAX_STAKES_PER_VAULT reached"
        );

        // update cached sum of stake units across all vaults
        _updateTotalStakeUnits();

        // store deposit amount and timestamp
        vaultData.stakes.push(StakeData(amount, block.timestamp));

        // update cached total vault and geyser deposits
        vaultData.totalStake = vaultData.totalStake.add(amount);
        _geyser.totalStake = _geyser.totalStake.add(amount);

        // call lock on vault
        IUniversalVault(vault).lock(_geyser.stakingToken, amount, permission);

        // emit event
        emit Deposit(vault, amount);
    }

    /// @notice Withdraw staking tokens and claim reward
    /// @dev rewards can only be claimed when withdrawing the stake
    /// access control: only owner of vault
    /// state machine:
    ///   - when vault exists on this geyser
    ///   - after deposit to vault
    ///   - can be called multiple times while sufficient deposit remains
    ///   - only online
    /// state scope:
    ///   - decrease _geyser.rewardSharesOutstanding
    ///   - decrease _geyser.totalStake
    ///   - increase _geyser.lastUpdate
    ///   - modify _geyser.totalStakeUnits
    ///   - modify _vaults[vault].stakes
    ///   - decrease _vaults[vault].totalStake
    /// token transfer:
    ///   - transfer staking tokens from vault to recipient
    ///   - transfer reward tokens from reward pool to recipient
    ///   - transfer bonus tokens from reward pool to recipient
    /// @param vault address The vault to withdraw from
    /// @param recipient address The recipient to withdraw to
    /// @param amount uint256 The amount of staking tokens to withdraw
    function withdraw(
        address vault,
        address recipient,
        uint256 amount,
        bytes calldata permission
    ) public override onlyOnline {
        // fetch vault storage reference
        VaultData storage vaultData = _vaults[vault];

        // verify non-zero amount
        require(amount != 0, "Geyser: no amount withdrawn");

        // validate recipient
        _validateAddress(recipient);

        // check for sufficient vault stake amount
        require(vaultData.totalStake >= amount, "Geyser: insufficient vault stake");

        // check for sufficient geyser stake amount
        // if this check fails, there is a bug in stake accounting
        assert(_geyser.totalStake >= amount);

        // update cached sum of stake units across all vaults
        _updateTotalStakeUnits();

        // get reward amount remaining
        uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);

        // calculate vested portion of reward pool
        uint256 rewardAvailable =
            calculateRewardAvailable(
                _geyser.rewardSchedules,
                rewardRemaining,
                _geyser.rewardSharesOutstanding,
                block.timestamp
            );

        // calculate vault time weighted reward with scaling
        (StakeData[] memory newStakes, uint256 reward, uint256 newTotalStakeUnits) =
            calculateRewardMulti(
                vaultData.stakes,
                amount,
                rewardAvailable,
                _geyser.totalStakeUnits,
                block.timestamp,
                _geyser.rewardScaling
            );

        // update stake data in storage
        if (newStakes.length == 0) {
            // all stakes have been withdrawn
            delete vaultData.stakes;
        } else {
            // some stakes have been completely or partially withdrawn
            // delete fully withdrawn stakes
            while (vaultData.stakes.length > newStakes.length) vaultData.stakes.pop();
            // update partially withdrawn stake
            uint256 lastIndex = vaultData.stakes.length.sub(1);
            vaultData.stakes[lastIndex].amount = newStakes[lastIndex].amount;
        }

        // update reward shares outstanding
        if (reward > 0) {
            // calculate shares to burn
            // sharesToBurn = sharesOutstanding * reward / rewardRemaining
            uint256 sharesToBurn = _geyser.rewardSharesOutstanding.mul(reward).div(rewardRemaining);

            // burn claimed shares
            _geyser.rewardSharesOutstanding = _geyser.rewardSharesOutstanding.sub(sharesToBurn);
        }

        // update cached totals
        vaultData.totalStake = vaultData.totalStake.sub(amount);
        _geyser.totalStake = _geyser.totalStake.sub(amount);
        _geyser.totalStakeUnits = newTotalStakeUnits;

        // transfer bonus tokens from reward pool to recipient
        if (_bonusTokenSet.length() > 0) {
            for (uint256 index = 0; index < _bonusTokenSet.length(); index++) {
                // fetch bonus token address reference
                address bonusToken = _bonusTokenSet.at(index);

                // calculate bonus token amount and transfer
                // bonusAmount = bonusRemaining * reward / rewardRemaining
                IRewardPool(_geyser.rewardPool).sendERC20(
                    bonusToken,
                    recipient,
                    IERC20(bonusToken).balanceOf(_geyser.rewardPool).mul(reward).div(
                        rewardRemaining
                    )
                );
            }
        }

        // transfer reward tokens from reward pool to recipient
        IRewardPool(_geyser.rewardPool).sendERC20(_geyser.rewardToken, recipient, reward);

        // unlock staking tokens from vault
        IUniversalVault(vault).unlock(_geyser.stakingToken, amount, permission);

        // emit event
        emit Withdraw(vault, recipient, amount, reward);
    }

    function rageQuit() external override {
        // fetch vault storage reference
        VaultData storage _vaultData = _vaults[msg.sender];

        // revert if no active stakes
        require(_vaultData.stakes.length != 0, "Geyser: no deposits");

        // update cached sum of stake units across all vaults
        _updateTotalStakeUnits();

        // update cached totals
        _geyser.totalStake = _geyser.totalStake.sub(_vaultData.totalStake);
        _geyser.totalStakeUnits = _geyser.totalStakeUnits.sub(
            calculateTotalStakeUnits(_vaultData.stakes, block.timestamp)
        );

        // delete stake data
        delete _vaults[msg.sender];
    }

    /* convenience functions */

    function _updateTotalStakeUnits() private {
        // update cached totalStakeUnits
        _geyser.totalStakeUnits = getTotalStakeUnits();
        // update cached lastUpdate
        _geyser.lastUpdate = block.timestamp;
    }

    function _validateAddress(address target) private view {
        // sanity check target for potential input errors
        require(isValidAddress(target), "Geyser: invalid address");
    }

    function _truncateStakesArray(StakeData[] memory array, uint256 newLength)
        private
        pure
        returns (StakeData[] memory newArray)
    {
        newArray = new StakeData[](newLength);
        for (uint256 index = 0; index < newLength; index++) {
            newArray[index] = array[index];
        }
        return newArray;
    }
}
