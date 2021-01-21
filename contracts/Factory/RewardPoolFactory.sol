// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";
import {IFactory} from "./IFactory.sol";
import {RewardPool} from "../RewardPool.sol";

/// @title Reward Pool Factory
/// @dev Security contact: dev-support@ampleforth.org
contract RewardPoolFactory is IFactory {
    using EnumerableSet for EnumerableSet.AddressSet;

    /* storage */

    EnumerableSet.AddressSet private _instanceSet;

    /* view functions */

    function created(address instance) external view override returns (bool validity) {
        return _instanceSet.contains(instance);
    }

    function instanceCount() external view override returns (uint256 count) {
        return _instanceSet.length();
    }

    function instanceAt(uint256 index) external view override returns (address instance) {
        return _instanceSet.at(index);
    }

    /* user functions */

    function create(bytes calldata args) external override returns (address) {
        address powerSwitch = abi.decode(args, (address));
        RewardPool pool = new RewardPool(powerSwitch);
        assert(_instanceSet.add(address(pool)));
        pool.transferOwnership(msg.sender);
        return address(pool);
    }

    function create2(bytes calldata, bytes32) external pure override returns (address) {
        revert("RewardPoolFactory: unused function");
    }
}
