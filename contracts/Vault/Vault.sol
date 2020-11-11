// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

interface IVault {
    function initialize(
        address stakingToken,
        address owner,
        uint256 geyserID
    ) external;

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external;

    function getOwner() external view returns (address owner);
}

/// @title Vault
/// @dev Security contact: dev-support@ampleforth.org
// todo: #15 consider adding support for other token standards to vault
// todo: #16 consider adding support for ERC1271 to vault
contract Vault is IVault, Ownable, Initializable {
    // todo: #17 consider packing vault storage
    address public _stakingToken;
    address public _geyser;
    uint256 public _geyserID;

    function initialize(
        address stakingToken,
        address owner,
        uint256 geyserID
    ) public override initializer {
        // set initialization data
        // todo: #21 set ownership directly to user instead of factory to save 5k gas per deploy
        Ownable.transferOwnership(owner);
        _stakingToken = stakingToken;
        _geyser = msg.sender;
        _geyserID = geyserID;
    }

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external override onlyOwner {
        // validate access control
        if (token == _stakingToken) {
            // only the geyser can transfer the staking tokens
            require(msg.sender == _geyser, "Vault: only geyser can transfer staking token");
        } else {
            // only the owner can transfer all other tokens
            require(msg.sender == Ownable.owner(), "Vault: only owner can transfer other tokens");
        }

        // cannot transfer tokens back to the vault
        require(to != address(this), "Vault: cannot transfer tokens back to the vault");

        // transfer tokens
        require(IERC20(token).transfer(to, value), "Vault: token transfer failed");
    }

    function getOwner() external view override returns (address owner) {
        return Ownable.owner();
    }
}
