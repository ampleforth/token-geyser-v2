// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";

import {ERC1271, Ownable} from "./Access/ERC1271.sol";
import {ExternalCall} from "./ExternalCall/ExternalCall.sol";

interface IVault {
    function initialize(address ownerAddress) external;

    function transferOwnership(address newOwner) external;

    function owner() external view returns (address ownerAddress);

    function lock(
        address token,
        uint256 amount,
        bytes calldata permission
    ) external;

    function unlock(
        address token,
        uint256 amount,
        bytes calldata permission
    ) external;
}

/// @title Vault
/// @notice Vault for isolated storage of staking tokens
/// @dev Security contact: dev-support@ampleforth.org
contract Vault is IVault, ERC1271, Initializable, ExternalCall {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /* storage */

    struct LockData {
        address geyser;
        address token;
        uint256 balance;
    }

    uint256 lockNonce;
    mapping(bytes32 => LockData) public locks;
    EnumerableSet.Bytes32Set private lockSet;

    /* initializer */

    function initialize(address ownerAddress) external override initializer {
        // set initialization data
        Ownable._setOwnership(ownerAddress);
    }

    /* pure functions */

    function calculateLockID(address geyser, address token) public pure returns (bytes32 lockID) {
        return keccak256(abi.encodePacked(geyser, token));
    }

    /* getter functions */

    function owner() public view override(IVault, Ownable) returns (address ownerAddress) {
        return Ownable.owner();
    }

    function getLockBalance(address geyser, address token) external view returns (uint256 balance) {
        return locks[calculateLockID(geyser, token)].balance;
    }

    function getTokensLocked(address token) external view returns (uint256 balance) {
        for (uint256 index; index < lockSet.length(); index++) {
            LockData storage lockData = locks[lockSet.at(index)];
            if (lockData.token == token && lockData.balance > balance) balance = lockData.balance;
        }
        return balance;
    }

    /* user functions */

    function transferOwnership(address newOwner) public override(IVault, Ownable) {
        Ownable.transferOwnership(newOwner);
    }

    /// @notice Perform an external call from the vault
    /// access control: only owner
    /// state machine: anytime
    /// state scope: none
    /// token transfer: restricted from calling staking token
    /// @param to Destination address of transaction.
    /// @param value Ether value of transaction
    /// @param data Data payload of transaction
    /// @param gas Gas that should be used for the transaction
    function externalCall(
        address to,
        uint256 value,
        bytes calldata data,
        uint256 gas
    ) external payable onlyOwner returns (bool success) {
        checkBalances();
        return _externalCall(to, value, data, gas);
    }

    function checkBalances() private view {
        for (uint256 index; index < lockSet.length(); index++) {
            LockData storage lockData = locks[lockSet.at(index)];
            require(
                IERC20(lockData.token).balanceOf(address(this)) >= lockData.balance,
                "Vault: balance locked"
            );
        }
    }

    // vault:ExternalCall -> geyser:Deposit() -> vault:Lock()
    function lock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            keccak256(abi.encodePacked("lock", msg.sender, token, amount, lockNonce)),
            permission
        )
    {
        // validate sufficient balance
        require(IERC20(token).balanceOf(address(this)) >= amount, "Vault: insufficient balance");

        // store lock data
        bytes32 lockID = calculateLockID(msg.sender, token);
        if (lockSet.contains(lockID)) {
            locks[lockID].balance += amount;
        } else {
            assert(lockSet.add(lockID));
            locks[lockID] = LockData(msg.sender, token, amount);
        }
    }

    // vault:ExternalCall -> geyser:Withdraw() -> vault:Unlock()
    function unlock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            keccak256(abi.encodePacked("unlock", msg.sender, token, amount, lockNonce)),
            permission
        )
    {
        // validate sufficient balance
        require(IERC20(token).balanceOf(address(this)) >= amount, "Vault: insufficient balance");

        // validate existing lock
        bytes32 lockID = keccak256(abi.encodePacked(msg.sender, token));
        require(lockSet.contains(lockID), "Vault: invalid lock");

        // validate sufficient lock amount
        require(locks[lockID].balance >= amount, "Vault: insufficient lock amount");

        // update lock data
        locks[lockID].balance -= amount;
    }
}
