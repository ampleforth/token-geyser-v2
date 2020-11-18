// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ERC1271, Ownable} from "../Access/ERC1271.sol";

contract MockERC1271 is ERC1271 {
    constructor() {
        Ownable._setOwnership(msg.sender);
    }
}
