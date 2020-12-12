// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

contract MockExternalContract {
    event Called();

    receive() external payable {}

    function emitEvent() external {
        emit Called();
    }

    function viewFunction() external view returns (uint256 timestamp) {
        return block.timestamp;
    }

    function revertFunction() external pure {
        revert();
    }
}
