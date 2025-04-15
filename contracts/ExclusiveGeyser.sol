// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IUniversalVault} from "./UniversalVault.sol";
import {Geyser} from "./Geyser.sol";

/// @title ExclusiveGeyser
/// @notice A special extension of GeyserV2 which enforces that,
///         no staking token balance may be staked in more than one geyser at a time.
/// @dev Security contact: dev-support@ampleforth.org
contract ExclusiveGeyser is Geyser {
    /// @inheritdoc Geyser
    function stake(
        address vault,
        uint256 amount,
        bytes calldata permission
    ) public override {
        // DISABLING STAKING
        require(false, "Staking disabled");

        // verify that vault isn't staking the same tokens in multiple programs
        _enforceExclusiveStake(IUniversalVault(vault), amount);

        // continue with regular stake
        super.stake(vault, amount, permission);
    }

    /// @dev Enforces that the vault can't use tokens which have already been staked.
    function _enforceExclusiveStake(IUniversalVault vault, uint256 amount) private view {
        require(amount <= computeAvailableStakingBalance(vault), "ExclusiveGeyser: expected exclusive stake");
    }

    /// @notice Computes the amount of staking tokens in the vault available to be staked exclusively.
    function computeAvailableStakingBalance(IUniversalVault vault) public view returns (uint256) {
        // Iterates through the vault's locks to compute the total "stakingToken" balance staked across all geysers.
        address stakingToken = super.getGeyserData().stakingToken;
        uint256 vaultBal = IERC20(stakingToken).balanceOf(address(vault));
        uint256 totalStakedBal = 0;
        uint256 lockCount = vault.getLockSetCount();
        for (uint256 i = 0; i < lockCount; i++) {
            IUniversalVault.LockData memory lock = vault.getLockAt(i);
            if (lock.token == stakingToken) {
                totalStakedBal += lock.balance;
            }
        }
        return (vaultBal > totalStakedBal) ? vaultBal - totalStakedBal : 0;
    }
}
