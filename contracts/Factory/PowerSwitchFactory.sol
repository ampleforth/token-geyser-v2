// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";

import {IFactory} from "./IFactory.sol";
import {InstanceRegistry} from "./InstanceRegistry.sol";
import {PowerSwitch} from "../PowerSwitch/PowerSwitch.sol";

/// @title Power Switch Factory
/// @dev Security contact: dev-support@ampleforth.org
contract PowerSwitchFactory is IFactory, InstanceRegistry {
    function create(bytes calldata args) external override returns (address) {
        address owner = abi.decode(args, (address));
        PowerSwitch powerSwitch = new PowerSwitch(owner);
        InstanceRegistry._register(address(powerSwitch));
        return address(powerSwitch);
    }

    function create2(bytes calldata, bytes32) external pure override returns (address) {
        revert("PowerSwitchFactory: unused function");
    }
}
