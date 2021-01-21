// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {Ownable} from "../Access/Ownable.sol";

contract MockOwnable is Ownable {
    constructor(address newOwner) {
        Ownable._setOwnership(newOwner);
    }

    function restrictedCall() public view onlyOwner {
        return;
    }
}
