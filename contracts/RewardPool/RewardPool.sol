// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Powered} from "../PowerSwitch/Powered.sol";

interface IRewardPool {
    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external;

    function rescueERC20(address[] calldata tokens, address recipient) external;
}

/// @title Reward Pool
/// @dev Security contact: dev-support@ampleforth.org
// todo: #18 consider adding support for other token standards to reward pool
contract RewardPool is IRewardPool, Powered, Ownable {
    constructor(address powerSwitch) {
        Powered._setPowerSwitch(powerSwitch);
    }

    function sendERC20(
        address token,
        address to,
        uint256 value
    ) external override onlyOwner onlyOnline {
        require(IERC20(token).transfer(to, value), "RewardPool: token transfer failed");
    }

    function rescueERC20(address[] calldata tokens, address recipient)
        external
        override
        onlyOffline
    {
        // only callable by controller
        require(
            msg.sender == Powered._getPowerController(),
            "RewardPool: only controller can withdraw after shutdown"
        );

        // assert recipient is defined
        require(recipient != address(0), "RewardPool: recipient not defined");

        // transfer tokens
        for (uint256 index = 0; index < tokens.length; index++) {
            // get token
            address token = tokens[index];
            // get balance
            uint256 balance = IERC20(token).balanceOf(address(this));
            // transfer token
            require(
                IERC20(token).transfer(recipient, balance),
                "RewardPool: token transfer failed"
            );
        }
    }
}
