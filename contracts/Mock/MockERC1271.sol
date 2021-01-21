// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ERC1271} from "../Access/ERC1271.sol";

contract MockERC1271 is ERC1271 {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function _getOwner() internal view override returns (address) {
        return owner;
    }
}
