// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {IUniversalVault} from "./UniversalVault.sol";
import {Geyser} from "./Geyser.sol";

/// @title ExclusiveGeyser
/// @notice A special extension of GeyserV2 which allows staking in,
///         at most one distribution program in any given time, for a given staking token.
/// @dev Security contact: dev-support@ampleforth.org
contract ExclusiveGeyser is Geyser {
    /// @inheritdoc Geyser
    function stake(
        address vault,
        uint256 amount,
        bytes calldata permission
    ) public override {
        // verify that vault has NOT locked staking token in other programs
        _enforceExclusiveStake(IUniversalVault(vault));

        // continue with regular stake
        super.stake(vault, amount, permission);
    }

    function _enforceExclusiveStake(IUniversalVault vault) private view {
        address stakingToken = super.getGeyserData().stakingToken;
        uint256 lockCount = vault.getLockSetCount();
        for (uint256 i = 0; i < lockCount; i++) {
            IUniversalVault.LockData memory lock = vault.getLockAt(i);
            if(lock.token == stakingToken){
                require(lock.delegate == address(this), "ExclusiveGeyser: expected exclusive stake");
            }
        }
    }
}
