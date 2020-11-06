// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRewardPool {
    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external;
}

/// @title Reward Pool
/// @dev Security contact: dev-support@ampleforth.org
// todo: #18 consider adding support for other token standards to reward pool
contract RewardPool is IRewardPool, Ownable {
    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external override onlyOwner {
        require(IERC20(token).transfer(to, value), "RewardPool: token transfer failed");
    }
}
