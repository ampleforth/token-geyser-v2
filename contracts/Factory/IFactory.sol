// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

interface IFactory {
    function created(address instance) external view returns (bool validity);

    function instanceCount() external view returns (uint256 count);

    function instanceAt(uint256 index) external view returns (address instance);

    function create(bytes calldata args) external returns (address instance);

    function create2(bytes calldata args, bytes32 salt) external returns (address instance);
}
