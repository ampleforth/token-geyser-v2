// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IFactory} from "./IFactory.sol";
import {CloneFactory} from "./CloneFactory.sol";
import {UniversalVault} from "../UniversalVault.sol";

/// @title Vault Factory
/// @dev Security contact: dev-support@ampleforth.org
contract VaultFactory is IFactory, CloneFactory {
    address public template;

    constructor() {
        template = address(new UniversalVault());
    }

    function create(bytes calldata args) external override returns (address vault) {
        return CloneFactory._create(template, args);
    }

    function create2(bytes calldata args, bytes32 salt) external override returns (address) {
        return CloneFactory._createSalty(template, args, salt);
    }
}
