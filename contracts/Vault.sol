// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

import {Powered} from "./PowerSwitch/Powered.sol";
import {ERC1271, Ownable} from "./Access/ERC1271.sol";

interface IVault {
    function initialize(
        address stakingToken,
        address ownerAddress,
        address powerSwitch,
        uint256 geyserID
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
    // todo: #17 consider packing vault storage
    address private _stakingToken;
    address private _geyser;
    uint256 private _geyserID;

    function initialize(
        address stakingToken,
        address ownerAddress,
        address powerSwitch,
        uint256 geyserID
    ) public override initializer {
        // set initialization data
        Ownable._setOwnership(ownerAddress);
        // todo: consider hardcoding powerswitch address to save on vault deployment consts
        Powered._setPowerSwitch(powerSwitch);
        _stakingToken = stakingToken;
        _geyser = msg.sender;
        _geyserID = geyserID;
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

    function getGeyserID() external view returns (uint256 geyserID) {
        return _geyserID;
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
        // - only the owner can transfer any tokens
        if (token != _stakingToken || Powered.isOffline()) {
            // only the owner can transfer all other tokens
            require(msg.sender == Ownable.owner(), "Vault: only owner can transfer other tokens");
        } else {
            // only the geyser can transfer the staking tokens when online
            require(msg.sender == _geyser, "Vault: only geyser can transfer staking token");
        }

        // validate recipient
        require(to != address(this), "Vault: cannot transfer tokens back to the vault");
        require(to != address(0), "Vault: cannot transfer tokens to null");
        require(to != token, "Vault: cannot transfer tokens to token");
        require(to != _geyser, "Vault: cannot transfer tokens to token");

        // transfer tokens
        require(IERC20(token).transfer(to, value), "Vault: token transfer failed");
    }
}
