// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

import {Powered} from "./PowerSwitch/Powered.sol";
import {ERC1271, Ownable} from "./Access/ERC1271.sol";

interface IVault {
    function initialize(
        address stakingToken,
        address ownerAddress,
        address powerSwitch
    ) external;

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external;

    function owner() external view returns (address ownerAddress);
}

/// @title Vault
/// @dev Security contact: dev-support@ampleforth.org
// todo: #15 consider adding support for other token standards to vault
contract Vault is IVault, ERC1271, Powered {
    /* storage */

    // todo: #17 consider packing vault storage
    address private _stakingToken;
    address private _geyser;

    /* initializer */

    function initialize(
        address stakingToken,
        address ownerAddress,
        address powerSwitch
    ) public override initializer {
        // set initialization data
        Ownable._setOwnership(ownerAddress);
        Powered._setPowerSwitch(powerSwitch);
        _stakingToken = stakingToken;
        _geyser = msg.sender;
    }

    /* getter functions */

    function owner() public view override(IVault, Ownable) returns (address ownerAddress) {
        return Ownable.owner();
    }

    function getStakingToken() external view returns (address stakingToken) {
        return _stakingToken;
    }

    function getGeyser() external view returns (address geyser) {
        return _geyser;
    }

    /* user functions */

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external override {
        // validate access control
        // when online
        // - only the geyser can transfer staking token
        // - only the owner can transfer all other tokens
        // when offline
        // - no one can transfer staking token
        // - only the owner can transfer all other tokens
        // when shutdown
        // - only the owner can transfer any tokens
        if (token == _stakingToken && Powered.isOnline()) {
            // only the geyser can transfer the staking tokens when online
            require(
                msg.sender == _geyser,
                "Vault: only geyser can transfer staking token when online"
            );
        } else if (token == _stakingToken && Powered.isOffline()) {
            // no one can transfer the staking tokens when offline
            revert("Vault: cannot transfer staking token when offline");
        } else {
            // only the owner can transfer all other tokens
            require(msg.sender == Ownable.owner(), "Vault: only owner can transfer");
        }

        // validate recipient
        require(to != address(this), "Vault: cannot transfer tokens back to the vault");
        require(to != address(0), "Vault: cannot transfer tokens to null");
        require(to != token, "Vault: cannot transfer tokens to token");
        require(to != _geyser, "Vault: cannot transfer tokens to geyser");

        // transfer tokens
        require(IERC20(token).transfer(to, value), "Vault: token transfer failed");
    }
}
