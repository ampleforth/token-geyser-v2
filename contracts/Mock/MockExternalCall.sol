// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ExternalCall} from "../ExternalCall/ExternalCall.sol";

contract MockExternalCall is ExternalCall {
    function externalCall(
        address to,
        uint256 value,
        bytes memory data,
        uint256 gas
    ) public payable returns (bool success) {
        return ExternalCall._externalCall(to, value, data, gas);
    }
}
