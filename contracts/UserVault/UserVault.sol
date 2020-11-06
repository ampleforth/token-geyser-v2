// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";

interface IUserVault {
    function initialize(
        address stakingToken,
        address user,
        uint256 geyserID
    ) external;

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external;
}

/// @title User Vault
/// @dev Security contact: dev-support@ampleforth.org
// todo: #15 consider adding support for other token standards to user vault
// todo: #16 consider adding support for ERC1271 to user vault
contract UserVault is IUserVault, Ownable, Initializable {
    // todo: #17 consider packing user vault storage
    address public _stakingToken;
    address public _geyser;
    uint256 public _geyserID;

    function initialize(
        address stakingToken,
        address user,
        uint256 geyserID
    ) public override initializer {
        // set initialization data
        Ownable.transferOwnership(user);
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
            require(msg.sender == _geyser, "UserVault: only geyser can transfer staking token");
        } else {
            // only the owner can transfer all other tokens
            require(
                msg.sender == Ownable.owner(),
                "UserVault: only owner can transfer other tokens"
            );
        }

        // cannot transfer tokens back to the vault
        require(to != address(this), "UserVault: cannot transfer tokens back to the vault");

        // transfer tokens
        require(IERC20(token).transfer(to, value), "UserVault: token transfer failed");
    }
}
