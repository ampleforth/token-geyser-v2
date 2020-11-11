// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IVault} from "./Vault/Vault.sol";
import {IRewardPool} from "./RewardPool/RewardPool.sol";

import {IFactory} from "./Factory/IFactory.sol";
import {CloneFactory} from "./Factory/CloneFactory.sol";

import {DecimalMath} from "./Math/DecimalMath.sol";

import {Powered} from "./PowerSwitch/Powered.sol";

interface IERC20Detailed is IERC20 {
    function decimals() external view returns (uint8);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);
}

// todo: #3 make geyser upgradable
// todo: #4 update documentation with math
contract Geyser is Powered, Ownable, CloneFactory {
    // todo: #6 consider using CarefulMath
    // https://github.com/compound-finance/compound-protocol/blob/master/contracts/CarefulMath.sol
    using SafeMath for uint256;
    using DecimalMath for uint256;
    using DecimalMath for uint8;

    /// constants ///

    uint256 public constant BASE_SHARES_PER_WEI = 1000000;

    function toDecimals(uint256 input, uint8 decimals) private pure returns (uint256 output) {
        return input.mul(DecimalMath.unit(decimals));
    }

    function fromDecimals(uint256 input, uint8 decimals) private pure returns (uint256 output) {
        return input.div(DecimalMath.unit(decimals));
    }

    /// storage ///

    // token pool factory
    address public tokenPoolFactory;

    // token vault template
    // todo: #5 consider using efficient address
    address public tokenVaultTemplate;

    // geysers
    GeyserData[] private _geysers;

    // todo: #10 improve struct packing
    struct GeyserData {
        address stakingToken;
        address rewardToken;
        address rewardPool;
        uint256 rewardScalingFloor;
        uint256 rewardScalingCeiling;
        uint256 rewardScalingTime;
        uint256 rewardSharesOutstanding;
        uint256 totalStake;
        uint256 totalStakeUnits;
        uint256 lastUpdate;
        address[] bonusTokens;
        RewardSchedule[] rewardSchedules;
        mapping(address => VaultData) vaults; // todo: #9 consider making vaults enumerable
    }

    struct RewardSchedule {
        uint256 duration;
        uint256 start;
        uint256 shares;
    }

    struct VaultData {
        bool deployed;
        uint256 totalStake;
        StakeData[] stakes;
    }

    struct StakeData {
        uint256 amount;
        uint256 timestamp;
    }

    /// admin events ///

    event GeyserCreated(uint256 geyserID);
    event GeyserFunded(uint256 geyserID, uint256 amount, uint256 duration);
    event BonusTokenRegistered(uint256 geyserID, address token);
    event TokenPoolFactoryUpdated(address newFactory, address caller);

    /// user events ///

    event Deposit(uint256 geyserID, address vault, uint256 amount);
    event Withdraw(
        uint256 geyserID,
        address vault,
        address recipient,
        uint256 amount,
        uint256 reward
    );

    /// initializer ///

    constructor(address powerSwitch) {
        Powered._setPowerSwitch(powerSwitch);
    }

    /// admin functions ///

    /// @notice Create new geyser program
    /// access control: only admin
    /// state machine: no dependencies
    /// state scope: should only modify state in _geysers[geyserID]
    /// token transfer: none
    function createGeyser(
        address stakingToken,
        address rewardToken,
        uint256 rewardScalingFloor,
        uint256 rewardScalingCeiling,
        uint256 rewardScalingTime
    ) external onlyOwner onlyOnline returns (uint256 geyserID) {
        // the scaling floor must be smaller than ceiling
        require(rewardScalingFloor <= rewardScalingCeiling, "Geyser: rewardScalingFloor above 100");

        // setting rewardScalingTime to 0 would cause divide by zero error
        // to disable reward scaling, use rewardScalingFloor == rewardScalingCeiling
        require(rewardScalingTime != 0, "Geyser: rewardScalingTime cannot be zero");

        // reward token must have decimals defined and >= 2 to enable reward scaling
        require(
            IERC20Detailed(rewardToken).decimals() >= 2,
            "Geyser: reward token has insuficient decimals"
        );

        // deploy reward pool
        bytes memory args = abi.encode(Powered._getPowerSwitch());
        address rewardPool = IFactory(tokenPoolFactory).create(args);

        // get geyserID
        geyserID = _geysers.length;

        // commit to storage
        GeyserData storage geyser = _geysers.push();
        geyser.stakingToken = stakingToken;
        geyser.rewardToken = rewardToken;
        geyser.rewardPool = rewardPool;
        geyser.rewardScalingFloor = rewardScalingFloor;
        geyser.rewardScalingCeiling = rewardScalingCeiling;
        geyser.rewardScalingTime = rewardScalingTime;

        // emit event
        emit GeyserCreated(geyserID);

        // explicit return
        return geyserID;
    }

    /// @notice Add funds to geyser program
    /// access control: only admin
    /// state machine:
    ///   - after geyser with geyserID created,
    ///   - can be called multiple times with same geyserID
    /// state scope: should only modify state in _geysers[geyserID]
    /// token transfer: transfer staking tokens from admin to reward pool
    function fundGeyser(
        uint256 geyserID,
        uint256 amount,
        uint256 duration
    ) external onlyOwner onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // validate geyserID
        require(geyser.stakingToken != address(0), "Geyser: invalid geyserID");

        // validate duration
        require(duration != 0, "Geyser: invalid duration"); // todo: add justification

        // get reward token decimals
        uint8 decimals = IERC20Detailed(geyser.rewardToken).decimals();

        // create new reward shares
        // if existing rewards on this geyser
        //   mint new shares proportional to % change in rewards remaining
        //   newShares = remainingShares * newReward / rewardRemaining
        // else
        //   mint new shares with BASE_SHARES_PER_WEI initial conversion rate
        //   store as fixed point number with same number of decimals as reward token
        uint256 newRewardShares;
        if (geyser.rewardSharesOutstanding > 0) {
            uint256 rewardRemaining = IERC20(geyser.rewardToken).balanceOf(geyser.rewardPool);
            newRewardShares = geyser.rewardSharesOutstanding.muld(amount, decimals).divd(
                rewardRemaining,
                decimals
            );
        } else {
            newRewardShares = amount.mul(BASE_SHARES_PER_WEI);
        }

        // add reward shares to total
        geyser.rewardSharesOutstanding = geyser.rewardSharesOutstanding.add(newRewardShares);

        // store new reward schedule
        geyser.rewardSchedules.push(RewardSchedule(duration, block.timestamp, newRewardShares));

        // transfer reward tokens to reward pool
        require(
            IERC20(geyser.rewardToken).transferFrom(msg.sender, geyser.rewardPool, amount),
            "Geyser: transfer to reward pool failed"
        );

        // emit event
        emit GeyserFunded(geyserID, amount, duration);
    }

    // register bonus token
    function registerBonusToken(uint256 geyserID, address token) external onlyOwner onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // add token to array
        geyser.bonusTokens.push(token);

        // emit event
        emit BonusTokenRegistered(geyserID, token);
    }

    // rescue tokens from reward pool
    function rescueTokensFromRewardPool(
        uint256 geyserID,
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // check not attempting to withdraw reward token
        require(token != geyser.rewardToken, "Geyser: cannot rescue reward token");

        // check not attempting to wthdraw bonus token
        for (uint256 index = 0; index < geyser.bonusTokens.length; index++) {
            require(token != geyser.bonusTokens[index], "Geyser: cannot rescue bonus token");
        }

        // transfer tokens to recipient
        IRewardPool(geyser.rewardPool).sendERC20(token, recipient, amount);
    }

    // update pool template
    function updateTokenPoolFactory(address factory) external onlyOwner onlyOnline {
        tokenPoolFactory = factory;
        emit TokenPoolFactoryUpdated(factory, msg.sender);
    }

    // update vault template
    // todo: implement updating vault template
    function updateVaultTemplate(address template) external onlyOwner onlyOnline {}

    /// user functions ///

    /// @notice Deposit staking tokens
    /// access control: anyone
    /// state machine:
    ///   - after geyser with geyserID created,
    ///   - can be called multiple times with same geyserID
    /// state scope: should only modify state in
    ///   - _geysers[geyserID].vaults[vaultAddress]
    ///   - _geysers[geyserID].totalStake
    /// token transfer: transfer staking tokens from msg.sender to vault
    /// @dev Note, anyone can deposit to any vault.
    function deposit(
        uint256 geyserID,
        address vaultAddress,
        uint256 amount
    ) external onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // fetch vault storage reference
        VaultData storage vault = geyser.vaults[vaultAddress];

        // update cached sum of stake units across all vaults
        updateStakeUnitAccounting(geyser);

        // create vault if first deposit, else verify vault is deployed
        if (vaultAddress == address(0)) {
            // craft initialization calldata
            bytes memory args = abi.encodeWithSelector(
                IVault.initialize.selector,
                geyser.stakingToken,
                msg.sender,
                Powered._getPowerSwitch(),
                geyserID
            );

            // create vault clone
            vaultAddress = CloneFactory._create(tokenVaultTemplate, args);

            // fetch vault storage reference
            vault = geyser.vaults[vaultAddress];

            // store deployment status
            vault.deployed = true;
        } else {
            // verify vault deployed at this address for this geyser
            require(vault.deployed, "Geyser: no vault deployed at this address for this geyser");
        }

        // store deposit amount and timestamp
        vault.stakes.push(StakeData(amount, block.timestamp));

        // update cached total vault and geyser deposits
        // todo: #11 consider removing vault totalStake cache and calculate dynamically
        vault.totalStake = vault.totalStake.add(amount);
        geyser.totalStake = geyser.totalStake.add(amount);

        // transfer staking tokens to vault
        require(
            IERC20(geyser.stakingToken).transferFrom(msg.sender, vaultAddress, amount),
            "Geyser: transfer to vault failed"
        );

        // emit event
        emit Deposit(geyserID, vaultAddress, amount);
    }

    function withdrawMultiple(uint256[] calldata geysers, address[] calldata vaults) external {}

    /// @notice Withdraw staking tokens and claim reward
    /// access control: anyone
    /// state machine:
    ///   - after deposit in geyser with geyserID
    ///   - can be called multiple times with same geyserID while sufficient deposit remains
    /// state scope:
    /// token transfer:
    function withdraw(
        uint256 geyserID,
        address vaultAddress,
        uint256 amount,
        address recipient
    ) external onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // fetch vault storage reference
        VaultData storage vault = geyser.vaults[vaultAddress];

        // verify vault deployed at this address for this geyser
        require(vault.deployed, "Geyser: no vault deployed at this address for this geyser");

        // require msg.sender is vault owner
        require(IVault(vaultAddress).getOwner() == msg.sender, "Geyser: only vault owner");

        // get reward token decimals
        uint8 decimals = IERC20Detailed(geyser.rewardToken).decimals();

        // get reward amount remaining
        uint256 rewardRemaining = IERC20(geyser.rewardToken).balanceOf(geyser.rewardPool);

        // validate recipient
        recipient = validateRecipient(geyser, vaultAddress, recipient);

        // check for sufficient vault stake amount
        // todo: consider removing vault totalStake cache and calculate dynamically
        require(vault.totalStake >= amount, "Geyser: insufficient vault stake");

        // check for sufficient geyser stake amount
        // if this check fails, there is a bug is stake accounting
        assert(geyser.totalStake >= amount);

        // update cached sum of stake units across all vaults
        updateStakeUnitAccounting(geyser);

        // calculate vested portion of reward pool
        uint256 rewardAvailable;
        {
            // calculate reward shares available across all reward schedules
            uint256 sharesAvailable;
            for (uint256 index = 0; index < geyser.rewardSchedules.length; index++) {
                // fetch reward schedule storage reference
                RewardSchedule storage schedule = geyser.rewardSchedules[index];

                // caculate amount of shares available on this schedule
                // if (now - start) >= duration
                //   sharesAvailable = shares
                // else
                //   sharesAvailable = shares * (now - start) / duration
                uint256 currentSharesAvailable;
                if (block.timestamp.sub(schedule.start) >= schedule.duration) {
                    currentSharesAvailable = schedule.shares;
                } else {
                    currentSharesAvailable = schedule
                        .shares
                        .muld(toDecimals(block.timestamp.sub(schedule.start), decimals), decimals)
                        .divd(toDecimals(schedule.duration, decimals), decimals);
                }

                // add to total
                sharesAvailable = sharesAvailable.add(currentSharesAvailable);
            }

            // convert shares to reward
            // rewardAvailable = sharesAvailable * rewardRemaining / sharesOutstanding
            rewardAvailable = sharesAvailable.muld(rewardRemaining, decimals).divd(
                geyser.rewardSharesOutstanding,
                decimals
            );
        }

        // calculate vault time weighted reward with scaling
        // todo: #12 consider implementing reward calculations with recursion
        uint256 reward = 0;
        {
            // calculate vault time weighted stake using LIFO
            uint256 amountToWithdraw = amount;
            while (amountToWithdraw > 0) {
                // fetch vault stake storage reference
                StakeData storage lastStake = vault.stakes[vault.stakes.length.sub(1)];

                // calculate stake duration
                uint256 stakeDuration = block.timestamp.sub(lastStake.timestamp);

                // calculate base reward
                uint256 baseReward;
                {
                    // get the stake amount to withdraw from the last stake
                    uint256 currentAmount;
                    if (lastStake.amount <= amountToWithdraw) {
                        // set current amount to total amount in this stake
                        currentAmount = lastStake.amount;

                        // delete stake data
                        vault.stakes.pop();
                    } else {
                        // set current amount to remaining withdrawl amount
                        currentAmount = amountToWithdraw;

                        // update stake data
                        lastStake.amount = lastStake.amount.sub(currentAmount);
                    }

                    // update cached total vault and geyser deposits
                    // todo: consider removing vault totalStake cache and calculate dynamically
                    vault.totalStake = vault.totalStake.sub(currentAmount);
                    geyser.totalStake = geyser.totalStake.sub(currentAmount);

                    // decrement counter
                    amountToWithdraw = amountToWithdraw.sub(currentAmount);

                    // calculate time weighted stake
                    uint256 stakeUnits = currentAmount.mul(stakeDuration);

                    // calculate base reward
                    // baseReward = rewardAvailable * stakeUnits / totalStakeUnits
                    // todo: #19 should stakeUnits be converted to decimals before multiplication?
                    baseReward = rewardAvailable.mul(stakeUnits).div(geyser.totalStakeUnits);

                    // update cached totalStakeUnits
                    // todo: consider updating in memory to avoid storage writes
                    geyser.totalStakeUnits = geyser.totalStakeUnits.sub(stakeUnits);
                }

                // calculate scaled reward
                // if no scaling or scaling period completed
                //   reward = baseReward
                // else
                //   minReward = baseReward * scalingFloor
                //   bonusReward = baseReward
                //                 * (scalingCeiling - scalingFloor)
                //                 * duration / scalingTime
                //   reward = minReward + bonusReward
                uint256 currentReward;
                if (
                    stakeDuration >= geyser.rewardScalingTime ||
                    geyser.rewardScalingFloor == geyser.rewardScalingCeiling
                ) {
                    // no reward scaling applied
                    currentReward = baseReward;
                } else {
                    // calculate minimum reward using scaling floor
                    uint256 minReward = baseReward.muld(
                        toDecimals(geyser.rewardScalingFloor, decimals - 2),
                        decimals
                    );

                    // calculate bonus reward with vested portion of scaling factor
                    uint256 bonusReward = baseReward
                        .muld(
                        toDecimals(
                            geyser.rewardScalingCeiling.sub(geyser.rewardScalingFloor),
                            decimals - 2
                        ),
                        decimals
                    )
                        .mul(stakeDuration)
                        .div(geyser.rewardScalingTime);

                    // add minimum reward and bonus reward
                    currentReward = minReward.add(bonusReward);
                }

                // add reward to total reward counter
                reward = reward.add(currentReward);
            }
        }

        // update reward shares outstanding
        {
            // calculate shares to burn
            // sharesToBurn = sharesOutstanding * reward / rewardRemaining
            uint256 sharesToBurn = geyser.rewardSharesOutstanding.muld(reward, decimals).divd(
                rewardRemaining,
                decimals
            );

            // burn claimed shares
            geyser.rewardSharesOutstanding = geyser.rewardSharesOutstanding.sub(sharesToBurn);
        }

        // transfer bonus tokens from reward pool to recipient
        if (geyser.bonusTokens.length > 0) {
            for (uint256 index = 0; index < geyser.bonusTokens.length; index++) {
                // fetch bonus token address reference
                address bonusToken = geyser.bonusTokens[index];

                // calculate bonus token amount
                // bonusAmount = bonusRemaining * reward / rewardRemaining
                uint256 bonusRemaining = IERC20(bonusToken).balanceOf(geyser.rewardPool);
                uint256 bonusAmount = bonusRemaining.mul(reward).div(rewardRemaining);

                // transfer bonus tokens
                IRewardPool(geyser.rewardPool).sendERC20(bonusToken, recipient, bonusAmount);
            }
        }

        // transfer staking tokens from vault to recipient
        IVault(vaultAddress).sendERC20(geyser.stakingToken, recipient, amount);

        // transfer reward tokens from reward pool to recipient
        IRewardPool(geyser.rewardPool).sendERC20(geyser.rewardToken, recipient, reward);

        // emit event
        emit Withdraw(geyserID, vaultAddress, recipient, amount, reward);
    }

    // rescue tokens from vault
    function rescueStakingTokensFromVault(
        uint256 geyserID,
        address vaultAddress,
        address recipient
    ) external onlyOnline {
        // fetch geyser storage reference
        GeyserData storage geyser = _geysers[geyserID];

        // fetch vault storage reference
        VaultData storage vault = geyser.vaults[vaultAddress];

        // verify vault deployed at this address for this geyser
        require(vault.deployed, "Geyser: no vault deployed at this address for this geyser");

        // require msg.sender is vault owner
        require(IVault(vaultAddress).getOwner() == msg.sender, "Geyser: only vault owner");

        // validate recipient
        recipient = validateRecipient(geyser, vaultAddress, recipient);

        // calculate amount of staking tokens to rescue
        uint256 amount = IERC20(geyser.stakingToken).balanceOf(vaultAddress).sub(vault.totalStake);

        // require non-zero amount
        require(amount > 0, "Geyser: no tokens to rescue");

        // transfer tokens to recipient
        IVault(vaultAddress).sendERC20(geyser.stakingToken, recipient, amount);
    }

    /// internal functions ///

    /// @notice Update stake unit accounting
    // todo: #13 consider updating stake unit accounting in memory to avoid storage writes
    function updateStakeUnitAccounting(GeyserData storage geyser) private {
        // calculate time since last accounting update
        uint256 timeSinceLastUpdate = block.timestamp.sub(geyser.lastUpdate);
        // calculate new stake units
        uint256 newStakeUnits = timeSinceLastUpdate.mul(geyser.totalStake);
        // update cached totalStakeUnits
        geyser.totalStakeUnits = geyser.totalStakeUnits.add(newStakeUnits);
        // update cached lastUpdate
        geyser.lastUpdate = block.timestamp;
    }

    // validate recipient
    function validateRecipient(
        GeyserData storage geyser,
        address vaultAddress,
        address recipient
    ) private view returns (address validRecipient) {
        // sanity check recipient for potential input errors
        require(recipient != address(this), "Geyser: cannot withdraw to geyser");
        require(recipient != geyser.stakingToken, "Geyser: cannot withdraw to stakingToken");
        require(recipient != geyser.rewardToken, "Geyser: cannot withdraw to rewardToken");
        require(recipient != geyser.rewardPool, "Geyser: cannot withdraw to rewardPool");
        require(recipient != vaultAddress, "Geyser: cannot withdraw to vault");

        // if recipient undefined, set to msg.sender
        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        // explicit return
        return recipient;
    }
}
