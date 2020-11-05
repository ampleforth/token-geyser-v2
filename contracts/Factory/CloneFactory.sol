// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import {Spawner} from "./Spawner.sol";

contract CloneFactory is Spawner {
    event InstanceCreated(address instance, address template);

    function _create(address template, bytes memory args) internal returns (address instance) {
        instance = Spawner._spawn(msg.sender, template, args);
        emit InstanceCreated(instance, template);
    }

    function _createSalty(
        address template,
        bytes memory args,
        bytes32 salt
    ) internal returns (address instance) {
        instance = Spawner._spawnSalty(msg.sender, template, args, salt);
        emit InstanceCreated(instance, template);
    }
}
