// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {CloneFactory} from "../Factory/CloneFactory.sol";

contract MockCloneFactory is CloneFactory {
    function create(address template, bytes calldata args) external returns (address instance) {
        return CloneFactory._create(template, args);
    }

    function createSalty(
        address template,
        bytes calldata args,
        bytes32 salt
    ) external returns (address instance) {
        return CloneFactory._createSalty(template, args, salt);
    }

    receive() external payable {}
}
