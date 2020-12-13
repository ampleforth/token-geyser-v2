// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IFactory} from "./IFactory.sol";
import {RewardPool} from "../RewardPool.sol";

/// @title Reward Pool Factory
/// @dev Security contact: dev-support@ampleforth.org
contract RewardPoolFactory is IFactory {
    function create(bytes calldata args) external override returns (address) {
        address powerSwitch = abi.decode(args, (address));
        RewardPool pool = new RewardPool(powerSwitch);
        pool.transferOwnership(msg.sender);
        return address(pool);
    }

    function create2(bytes calldata, bytes32) external pure override returns (address) {
        revert("RewardPoolFactory: unused function");
    }
}
