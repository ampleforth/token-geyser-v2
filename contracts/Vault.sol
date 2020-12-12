// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

import {Powered} from "./PowerSwitch/Powered.sol";
import {ERC1271, Ownable} from "./Access/ERC1271.sol";
import {ExternalCall} from "./ExternalCall/ExternalCall.sol";

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

    function transferOwnership(address newOwner) external;

    function owner() external view returns (address ownerAddress);

    function getStakingToken() external view returns (address stakingToken);

    function getGeyser() external view returns (address geyser);
}

/// @title Vault
/// @notice Vault for isolated storage of staking tokens
/// @dev Security contact: dev-support@ampleforth.org
contract Vault is IVault, ERC1271, Powered, ExternalCall {
    /* storage */

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

    function getStakingToken() external view override returns (address stakingToken) {
        return _stakingToken;
    }

    function getGeyser() external view override returns (address geyser) {
        return _geyser;
    }

    /* user functions */

    function transferOwnership(address newOwner) public override(IVault, Ownable) {
        Ownable.transferOwnership(newOwner);
    }

    /// @notice Send an ERC20 token
    /// access control:
    ///   - when online
    ///     - only the geyser can transfer staking token
    ///     - only the owner can transfer all other tokens
    ///   - when offline
    ///     - no one can transfer staking token
    ///     - only the owner can transfer all other tokens
    ///   - when shutdown
    ///     - only the owner can transfer any tokens
    /// state machine: anytime
    /// state scope: none
    /// token transfer: transfer tokens from self to recipient
    /// @param token address The token to send
    /// @param to address The recipient to send to
    /// @param value uint256 Amount of tokens to send
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
        require(to != address(this), "Vault: invalid address");
        require(to != address(0), "Vault: invalid address");
        require(to != token, "Vault: invalid address");
        require(to != _geyser, "Vault: invalid address");

        // transfer tokens
        require(IERC20(token).transfer(to, value), "Vault: token transfer failed");
    }

    /// @notice Perform an external call from the vault
    /// access control: only owner
    /// state machine: anytime
    /// state scope: none
    /// token transfer: restricted from calling staking token
    /// @param to Destination address of transaction.
    /// @param value Ether value of transaction
    /// @param data Data payload of transaction
    /// @param gas Gas that should be used for the transaction
    function externalCall(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 gas
    ) external payable onlyOwner returns (bool success) {
        require(to != _stakingToken, "Vault: cannot call staking token");
        return _externalCall(to, value, data, gas);
    }
}
