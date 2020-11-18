// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IFactory} from "./IFactory.sol";
import {PowerSwitch} from "../PowerSwitch/PowerSwitch.sol";

/// @title Power Switch Factory
/// @dev Security contact: dev-support@ampleforth.org
contract PowerSwitchFactory is IFactory {
    function create(bytes calldata args) external override returns (address) {
        address owner = abi.decode(args, (address));
        PowerSwitch powerSwitch = new PowerSwitch(owner);
        return address(powerSwitch);
    }

    function create2(bytes calldata) external pure override returns (address) {
        revert("PowerSwitchFactory: unused function");
    }
}
