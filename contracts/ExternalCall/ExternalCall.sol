// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {Math} from "@openzeppelin/contracts/math/Math.sol";

/// @title ExternalCall
/// @notice Helper for calling arbitrary external functions
/// @dev Security contact: dev-support@ampleforth.org
contract ExternalCall {
    using Math for uint256;

    /* events */

    event ExternalCallSuccess();
    event ExternalCallFailure();

    /* user functions */

    receive() external payable {}

    /// @dev Allows to execute an arbitrary transaction.
    /// @param to Destination address of transaction.
    /// @param value Ether value of transaction.
    /// @param data Data payload of transaction.
    /// @param gas Gas that should be used for the transaction.
    function _externalCall(
        address to,
        uint256 value,
        bytes memory data,
        uint256 gas
    ) internal returns (bool success) {
        // We require some gas to emit the events (at least 2500) after the execution and
        // some to perform code until the execution (500)
        // We also include the 1/64 in the check that is not send along with a call to
        // counteract potential shortings because of EIP-150
        require(
            gasleft() >= ((gas * 64) / 63).max(gas + 2500) + 500,
            "ExternalCall: Not enough gas to execute call"
        );
        // If the gas is 0 we assume that nearly all available gas can be used
        // We only substract 2500 (compared to the 3000 before) to ensure that the amount passed
        // is still higher than gas
        success = _executeCall(to, value, data, gas == 0 ? (gasleft() - 2500) : gas);
        if (success) emit ExternalCallSuccess();
        else emit ExternalCallFailure();
    }

    function _executeCall(
        address to,
        uint256 value,
        bytes memory data,
        uint256 txGas
    ) private returns (bool success) {
        assembly {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }
}
