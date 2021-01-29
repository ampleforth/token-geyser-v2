// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {InstanceRegistry} from "./InstanceRegistry.sol";

/// @title GeyserRegistry
/// @dev Security contact: dev-support@ampleforth.org
contract GeyserRegistry is InstanceRegistry, Ownable {
    function register(address instance) external onlyOwner {
        InstanceRegistry._register(instance);
    }
}
