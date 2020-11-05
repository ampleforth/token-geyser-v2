// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.4;

interface IFactory {
    function create(bytes calldata args) external returns (address);

    function create2(bytes calldata args) external returns (address);
}
