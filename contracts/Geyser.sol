// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;
pragma abicoder v2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IVault} from "./Vault.sol";
import {IRewardPool} from "./RewardPool.sol";

import {IFactory} from "./Factory/IFactory.sol";
import {CloneFactory} from "./Factory/CloneFactory.sol";

import {DecimalMath} from "./Math/DecimalMath.sol";

import {Powered} from "./PowerSwitch/Powered.sol";
import {Ownable} from "./Access/Ownable.sol";

// import "hardhat/console.sol";

interface IERC20Detailed is IERC20 {
    function decimals() external view returns (uint8);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}

interface IGeyser {
    // todo: #10 improve struct packing
    struct GeyserData {
        address stakingToken;
        address rewardToken;
        address rewardPool;
        address vaultTemplate; // todo: #5 consider using immutable efficient address
        uint256 rewardScalingFloor;
        uint256 rewardScalingCeiling;
        uint256 rewardScalingTime;
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

    function getGeyserData() external view returns (GeyserData memory geyser);

    function getVaultData(address vault) external view returns (VaultData memory vaultData);

    function createVault() external returns (address vault);

    function deposit(address vault, uint256 amount) external;

    function createVaultAndDeposit(uint256 amount) external returns (address vault);

    function withdraw(
        address vault,
        uint256 amount,
        address recipient
    ) external;
}

// todo: #4 update documentation with math
contract Geyser is IGeyser, Powered, Ownable, CloneFactory {
    // todo: #6 consider using CarefulMath
    // https://github.com/compound-finance/compound-protocol/blob/master/contracts/CarefulMath.sol
    using SafeMath for uint256;
    using DecimalMath for uint256;
    using DecimalMath for uint8;
    using EnumerableSet for EnumerableSet.AddressSet;

    /* constants */

    uint256 public constant BASE_SHARES_PER_WEI = 1000000;

    function toDecimals(uint256 input, uint8 decimals) private pure returns (uint256 output) {
        return input.mul(DecimalMath.unit(decimals));
    }

    function fromDecimals(uint256 input, uint8 decimals) private pure returns (uint256 output) {
        return input.div(DecimalMath.unit(decimals));
    }

    /* storage */

    // geyser
    GeyserData private _geyser;
    mapping(address => VaultData) private _vaults;
    EnumerableSet.AddressSet private _vaultSet;
    EnumerableSet.AddressSet private _bonusTokenSet;

    /* admin events */

    event GeyserCreated(address rewardPool, address powerSwitch);
    event GeyserFunded(uint256 amount, uint256 duration);
    event BonusTokenRegistered(address token);

    /* user events */

    event VaultCreated(address vault);
    event Deposit(address vault, uint256 amount);
    event Withdraw(address vault, address recipient, uint256 amount, uint256 reward);

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

    function getVaultSetLength() external view returns (uint256 length) {
        return _vaultSet.length();
    }

    function getVaultAtIndex(uint256 index) external view returns (address vault) {
        return _vaultSet.at(index);
    }

    function getVaultData(address vault)
        external
        view
        override
        returns (VaultData memory vaultData)
    {
        return _vaults[vault];
    }

    /* initializer */

    function initialize(
        address owner,
        address rewardPoolFactory,
        address powerSwitchFactory,
        address stakingToken,
        address rewardToken,
        address vaultTemplate,
        uint256 rewardScalingFloor,
        uint256 rewardScalingCeiling,
        uint256 rewardScalingTime
    ) external initializer {
        // the scaling floor must be smaller than ceiling
        require(
            rewardScalingFloor <= rewardScalingCeiling,
            "Geyser: rewardScalingFloor above rewardScalingCeiling"
        );

        // setting rewardScalingTime to 0 would cause divide by zero error
        // to disable reward scaling, use rewardScalingFloor == rewardScalingCeiling
        require(rewardScalingTime != 0, "Geyser: rewardScalingTime cannot be zero");

        // reward token must have decimals defined and >= 2 to enable reward scaling
        require(
            IERC20Detailed(rewardToken).decimals() >= 2,
            "Geyser: reward token has insuficient decimals"
        );

        // deploy power switch
        address powerSwitch = IFactory(powerSwitchFactory).create(abi.encode(owner));

        // deploy reward pool
        address rewardPool = IFactory(rewardPoolFactory).create(abi.encode(powerSwitch));

        // set internal configs
        Ownable._setOwnership(owner);
        Powered._setPowerSwitch(powerSwitch);

        // commit to storage
        _geyser.stakingToken = stakingToken;
        _geyser.rewardToken = rewardToken;
        _geyser.rewardPool = rewardPool;
        _geyser.vaultTemplate = vaultTemplate;
        _geyser.rewardScalingFloor = rewardScalingFloor;
        _geyser.rewardScalingCeiling = rewardScalingCeiling;
        _geyser.rewardScalingTime = rewardScalingTime;

        // emit event
        emit GeyserCreated(rewardPool, powerSwitch);
    }

    /* admin functions */

    /// @notice Add funds to the geyser
    /// access control: only admin
    /// state machine:
    ///   - after geyser initialized
    ///   - can be called multiple times
    ///   - when not paused
    ///   - when not shutdown
    /// state scope: should only modify state in _geyser
    /// token transfer: transfer staking tokens from admin to reward pool
    function fundGeyser(uint256 amount, uint256 duration) external onlyOwner onlyOnline {
        // validate duration
        require(duration != 0, "Geyser: invalid duration"); // todo: add justification

        // get reward token decimals
        uint8 decimals = IERC20Detailed(_geyser.rewardToken).decimals();

        // create new reward shares
        // if existing rewards on this geyser
        //   mint new shares proportional to % change in rewards remaining
        //   newShares = remainingShares * newReward / rewardRemaining
        // else
        //   mint new shares with BASE_SHARES_PER_WEI initial conversion rate
        //   store as fixed point number with same number of decimals as reward token
        uint256 newRewardShares;
        if (_geyser.rewardSharesOutstanding > 0) {
            uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);
            newRewardShares = _geyser.rewardSharesOutstanding.muld(amount, decimals).divd(
                rewardRemaining,
                decimals
            );
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

    // register bonus token
    function registerBonusToken(address token) external onlyOwner onlyOnline {
        // verify valid bonus token
        requireNotEqual(token, address(0));
        requireNotEqual(token, address(this));
        requireNotEqual(token, _geyser.stakingToken);
        requireNotEqual(token, _geyser.rewardToken);
        requireNotEqual(token, _geyser.rewardPool);

        // add token to set
        require(_bonusTokenSet.add(token), "Geyser: bonus token already registered");

        // emit event
        emit BonusTokenRegistered(token);
    }

    // rescue tokens from reward pool
    function rescueTokensFromRewardPool(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner onlyOnline {
        validateRecipient(recipient);

        // check not attempting to withdraw reward token
        requireNotEqual(token, _geyser.rewardToken);

        // check not attempting to wthdraw bonus token
        require(!_bonusTokenSet.contains(token), "Geyser: invalid address");

        // transfer tokens to recipient
        IRewardPool(_geyser.rewardPool).sendERC20(token, recipient, amount);
    }

    /* user functions */

    function createVault() public override onlyOnline returns (address vault) {
        // craft initialization calldata
        bytes memory args = abi.encodeWithSelector(
            IVault.initialize.selector,
            _geyser.stakingToken,
            msg.sender,
            Powered.getPowerSwitch()
        );

        // create vault clone
        vault = CloneFactory._create(_geyser.vaultTemplate, args);

        // add vault to vault set
        // should never fail given fresh vault deployment
        assert(_vaultSet.add(vault));

        // emit event
        emit VaultCreated(vault);

        // explicit return
        return vault;
    }

    /// @notice Deposit staking tokens
    /// access control: anyone
    /// state machine:
    ///   - can be called multiple times
    ///   - when not paused
    ///   - when not shutdown
    ///   - when vault exists on this geyser
    /// state scope: should only modify state in
    ///   - _vaults[vault]
    ///   - _geyser.totalStake
    /// token transfer: transfer staking tokens from msg.sender to vault
    /// @dev Note, anyone can deposit to any vault.
    function deposit(address vault, uint256 amount) public override onlyOnline {
        // fetch vault storage reference
        VaultData storage vaultData = _vaults[vault];

        // verify non-zero amount
        require(amount != 0, "Geyser: no amount deposited");

        // verify vault at this address for this geyser
        require(_vaultSet.contains(vault), "Geyser: invalid vault");

        // update cached sum of stake units across all vaults
        updateStakeUnitAccounting();

        // store deposit amount and timestamp
        vaultData.stakes.push(StakeData(amount, block.timestamp));

        // update cached total vault and geyser deposits
        // todo: #11 consider removing vault totalStake cache and calculate dynamically
        vaultData.totalStake = vaultData.totalStake.add(amount);
        _geyser.totalStake = _geyser.totalStake.add(amount);

        // transfer staking tokens to vault
        require(
            IERC20(_geyser.stakingToken).transferFrom(msg.sender, vault, amount),
            "Geyser: transfer to vault failed"
        );

        // emit event
        emit Deposit(vault, amount);
    }

    function createVaultAndDeposit(uint256 amount)
        external
        override
        onlyOnline
        returns (address vault)
    {
        // create vault
        vault = createVault();

        // deposit stake
        deposit(vault, amount);

        // explicit return
        return vault;
    }

    /// @notice Withdraw staking tokens and claim reward
    /// access control: owner of vault
    /// state machine:
    ///   - after user deposit
    ///   - can be called multiple times while sufficient deposit remains
    ///   - only online
    /// state scope:
    ///   - _geyser
    ///   - _vaults[vault]
    /// token transfer:
    ///   - transfer staking tokens from vault to recipient
    ///   - transfer reward tokens from reward pool to recipient
    ///   - transfer bonus tokens from reward pool to recipient
    function withdraw(
        address vault,
        uint256 amount,
        address recipient
    ) public override onlyOnline {
        // fetch vault storage reference
        VaultData storage vaultData = _vaults[vault];

        // verify non-zero amount
        require(amount != 0, "Geyser: no amount withdrawn");

        // verify vault at this address for this geyser
        require(_vaultSet.contains(vault), "Geyser: invalid vault");

        // require msg.sender is vault owner
        require(IVault(vault).owner() == msg.sender, "Geyser: only vault owner");

        // get reward token decimals
        uint8 decimals = IERC20Detailed(_geyser.rewardToken).decimals();

        // get reward amount remaining
        uint256 rewardRemaining = IERC20(_geyser.rewardToken).balanceOf(_geyser.rewardPool);

        // validate recipient
        requireNotEqual(recipient, vault);
        validateRecipient(recipient);

        // check for sufficient vault stake amount
        // todo: consider removing vault totalStake cache and calculate dynamically
        require(vaultData.totalStake >= amount, "Geyser: insufficient vault stake");

        // check for sufficient geyser stake amount
        // if this check fails, there is a bug in stake accounting
        assert(_geyser.totalStake >= amount);

        // update cached sum of stake units across all vaults
        updateStakeUnitAccounting();

        // calculate vested portion of reward pool
        uint256 rewardLocked = calculateRewardLocked(rewardRemaining, decimals);

        // calculate vault time weighted reward with scaling
        uint256 reward = calculateRewardRecursively(
            vaultData,
            amount,
            rewardRemaining.sub(rewardLocked)
        );

        // update reward shares outstanding
        if (reward > 0) {
            // calculate shares to burn
            // sharesToBurn = sharesOutstanding * reward / rewardRemaining
            uint256 sharesToBurn = _geyser.rewardSharesOutstanding.muld(reward, decimals).divd(
                rewardRemaining,
                decimals
            );

            // burn claimed shares
            _geyser.rewardSharesOutstanding = _geyser.rewardSharesOutstanding.sub(sharesToBurn);
        }

        // transfer bonus tokens from reward pool to recipient
        if (_bonusTokenSet.length() > 0) {
            for (uint256 index = 0; index < _bonusTokenSet.length(); index++) {
                // fetch bonus token address reference
                address bonusToken = _bonusTokenSet.at(index);

                // calculate bonus token amount
                // bonusAmount = bonusRemaining * reward / rewardRemaining
                uint256 bonusRemaining = IERC20(bonusToken).balanceOf(_geyser.rewardPool);
                uint256 bonusAmount = bonusRemaining.mul(reward).div(rewardRemaining);

                // transfer bonus tokens
                IRewardPool(_geyser.rewardPool).sendERC20(bonusToken, recipient, bonusAmount);
            }
        }

        // transfer staking tokens from vault to recipient
        IVault(vault).sendERC20(_geyser.stakingToken, recipient, amount);

        // transfer reward tokens from reward pool to recipient
        IRewardPool(_geyser.rewardPool).sendERC20(_geyser.rewardToken, recipient, reward);

        // emit event
        emit Withdraw(vault, recipient, amount, reward);
    }

    function withdrawMulti(
        address[] calldata vaults,
        uint256[] calldata amounts,
        address[] calldata recipients
    ) external onlyOnline {
        // verify input array lengths
        require(vaults.length == amounts.length, "Geyser: wrong input array length");
        require(vaults.length == recipients.length, "Geyser: wrong input array length");

        // withdraw from each vault
        for (uint256 index = 0; index < vaults.length; index++) {
            withdraw(vaults[index], amounts[index], recipients[index]);
        }
    }

    // rescue tokens from vault
    function rescueStakingTokensFromVault(address vault, address recipient) external onlyOnline {
        // fetch vault storage reference
        VaultData storage vaultData = _vaults[vault];

        // verify vault at this address for this geyser
        require(_vaultSet.contains(vault), "Geyser: invalid vault");

        // require msg.sender is vault owner
        require(IVault(vault).owner() == msg.sender, "Geyser: only vault owner");

        // validate recipient
        requireNotEqual(recipient, vault);
        validateRecipient(recipient);

        // calculate amount of staking tokens to rescue
        uint256 amount = IERC20(_geyser.stakingToken).balanceOf(vault).sub(vaultData.totalStake);

        // require non-zero amount
        require(amount > 0, "Geyser: no tokens to rescue");

        // transfer tokens to recipient
        IVault(vault).sendERC20(_geyser.stakingToken, recipient, amount);
    }

    /* convenience functions */

    /// @notice Update stake unit accounting
    // todo: #13 consider updating stake unit accounting in memory to avoid storage writes
    function updateStakeUnitAccounting() public {
        // calculate time since last accounting update
        uint256 timeSinceLastUpdate = block.timestamp.sub(_geyser.lastUpdate);
        // calculate new stake units
        uint256 newStakeUnits = timeSinceLastUpdate.mul(_geyser.totalStake);
        // update cached totalStakeUnits
        _geyser.totalStakeUnits = _geyser.totalStakeUnits.add(newStakeUnits);
        // update cached lastUpdate
        _geyser.lastUpdate = block.timestamp;
    }

    function requireNotEqual(address a, address b) private pure {
        require(a != b, "Geyser: invalid address");
    }

    function calculateRewardLocked(uint256 rewardRemaining, uint8 decimals)
        public
        view
        returns (uint256 rewardLocked)
    {
        // return 0 if no registered schedules
        if (_geyser.rewardSchedules.length == 0) {
            return 0;
        }

        // calculate reward shares locked across all reward schedules
        uint256 sharesLocked;
        for (uint256 index = 0; index < _geyser.rewardSchedules.length; index++) {
            // fetch reward schedule storage reference
            RewardSchedule storage schedule = _geyser.rewardSchedules[index];

            // caculate amount of shares available on this schedule
            // if (now - start) >= duration
            //   sharesLocked = 0
            // else
            //   sharesLocked = shares - (shares * (now - start) / duration)
            uint256 currentSharesLocked;
            if (block.timestamp.sub(schedule.start) >= schedule.duration) {
                currentSharesLocked = 0;
            } else {
                currentSharesLocked = schedule.shares.sub(
                    schedule
                        .shares
                        .muld(toDecimals(block.timestamp.sub(schedule.start), decimals), decimals)
                        .divd(toDecimals(schedule.duration, decimals), decimals)
                );
            }

            // add to running total
            sharesLocked = sharesLocked.add(currentSharesLocked);
        }

        // convert shares to reward
        // rewardLocked = sharesLocked * rewardRemaining / sharesOutstanding
        rewardLocked = sharesLocked.muld(rewardRemaining, decimals).divd(
            _geyser.rewardSharesOutstanding,
            decimals
        );

        // explicit return
        return rewardLocked;
    }

    // validate recipient
    function validateRecipient(address recipient) public view {
        // sanity check recipient for potential input errors
        requireNotEqual(recipient, address(this));
        requireNotEqual(recipient, _geyser.stakingToken);
        requireNotEqual(recipient, _geyser.rewardToken);
        requireNotEqual(recipient, _geyser.rewardPool);
        requireNotEqual(recipient, address(0));
    }

    /* internal functions */

    function calculateRewardRecursively(
        VaultData storage vault,
        uint256 amountToWithdraw,
        uint256 rewardAvailable
    ) private returns (uint256 reward) {
        // fetch vault stake storage reference
        StakeData storage lastStake = vault.stakes[vault.stakes.length.sub(1)];

        // calculate stake duration
        uint256 stakeDuration = block.timestamp.sub(lastStake.timestamp);

        if (lastStake.amount >= amountToWithdraw) {
            // if size of last stake is more than amountToWithdraw -> base case
            // - set current amount
            // - calculate current reward
            // - update cached values (vault.totalStake, geyser.totalStake, geyser.totalStakeUnits)
            // - update last stake amount in storage
            // - return current reward

            // set current amount to remaining withdrawl amount
            uint256 currentAmount = amountToWithdraw;

            // calculate reward amount
            uint256 currentReward = calculateCurrentReward(
                vault,
                IntermediateValue(rewardAvailable, currentAmount, stakeDuration)
            );

            // update stake data
            if (lastStake.amount == amountToWithdraw) {
                // delete stake data
                vault.stakes.pop();
            } else {
                // update stake data
                lastStake.amount = lastStake.amount.sub(currentAmount);
            }

            // return reward amount
            return currentReward;
        } else {
            // else if size of last stake is less than amountToWithdraw -> recursive case
            // - set current amount
            // - calculate current reward
            // - update cached values (vault.totalStake, geyser.totalStake, geyser.totalStakeUnits)
            // - delete last stake
            // - recurse with updated amountToWithdraw and rewardAvailable
            // - return sum of recursion and current reward

            // set current amount to total amount in this stake
            uint256 currentAmount = lastStake.amount;

            // calculate reward amount
            uint256 currentReward = calculateCurrentReward(
                vault,
                IntermediateValue(rewardAvailable, currentAmount, stakeDuration)
            );

            // delete stake data
            vault.stakes.pop();

            // recurse
            uint256 recursiveSum = calculateRewardRecursively(
                vault,
                amountToWithdraw.sub(currentAmount),
                rewardAvailable.sub(currentReward)
            );

            // return reward sum
            return recursiveSum.add(currentReward);
        }
    }

    // used to avoid hitting stack depth limit
    struct IntermediateValue {
        uint256 rewardAvailable;
        uint256 currentAmount;
        uint256 stakeDuration;
    }

    function calculateCurrentReward(VaultData storage vault, IntermediateValue memory params)
        private
        returns (uint256 currentReward)
    {
        // - calculate stake units
        // - calculate stake units / total stake units as size of withdrawl
        // - multiply by reward availalbe to determine base reward
        // - apply reward scaling to obtain current reward

        // get reward token decimals
        uint8 decimals = IERC20Detailed(_geyser.rewardToken).decimals();

        // calculate time weighted stake
        uint256 stakeUnits = params.currentAmount.mul(params.stakeDuration);

        // calculate base reward
        // baseReward = rewardAvailable * stakeUnits / totalStakeUnits
        // todo: #19 should stakeUnits be converted to decimals before multiplication?
        uint256 baseReward;
        if (_geyser.totalStakeUnits == 0) {
            // handle edge case where flash stake on first stake
            baseReward = 0;
        } else {
            // scale reward according to proportional weight
            baseReward = params.rewardAvailable.mul(stakeUnits).div(_geyser.totalStakeUnits);
        }

        // calculate scaled reward
        // if no scaling or scaling period completed
        //   currentReward = baseReward
        // else
        //   minReward = baseReward * scalingFloor
        //   bonusReward = baseReward
        //                 * (scalingCeiling - scalingFloor)
        //                 * duration / scalingTime
        //   currentReward = minReward + bonusReward
        if (
            params.stakeDuration >= _geyser.rewardScalingTime ||
            _geyser.rewardScalingFloor == _geyser.rewardScalingCeiling
        ) {
            // no reward scaling applied
            currentReward = baseReward;
        } else {
            // calculate minimum reward using scaling floor
            uint256 minReward = baseReward.muld(
                toDecimals(_geyser.rewardScalingFloor, decimals - 2),
                decimals
            );

            // calculate bonus reward with vested portion of scaling factor
            uint256 bonusReward = baseReward
                .muld(
                toDecimals(
                    _geyser.rewardScalingCeiling.sub(_geyser.rewardScalingFloor),
                    decimals - 2
                ),
                decimals
            )
                .mul(params.stakeDuration)
                .div(_geyser.rewardScalingTime);

            // add minimum reward and bonus reward
            currentReward = minReward.add(bonusReward);
        }

        // update cached total vault and geyser deposits
        // todo: consider removing vault totalStake cache and calculate dynamically
        vault.totalStake = vault.totalStake.sub(params.currentAmount);
        _geyser.totalStake = _geyser.totalStake.sub(params.currentAmount);

        // update cached totalStakeUnits
        // todo: consider updating in memory to avoid storage writes
        _geyser.totalStakeUnits = _geyser.totalStakeUnits.sub(stakeUnits);

        // return scaled reward
        return currentReward;
    }
}
