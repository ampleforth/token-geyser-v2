// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {ERC1271Bytes} from "../Access/ERC1271Bytes.sol";

contract MockSmartWalletBytes is ERC1271Bytes {
    address private _owner;

    constructor(address owner) {
        _owner = owner;
    }

    function _getOwner() internal view override returns (address) {
        return _owner;
    }
}
