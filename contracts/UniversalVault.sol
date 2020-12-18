// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";

import {ERC1271, Ownable} from "./Access/ERC1271.sol";
import {ExternalCall} from "./ExternalCall/ExternalCall.sol";
import {IPowerSwitch} from "./PowerSwitch/PowerSwitch.sol";
import {IPowered} from "./PowerSwitch/Powered.sol";

interface IUniversalVault {
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

/// @title UniversalVault
/// @notice Vault for isolated storage of staking tokens
/// @dev Security contact: dev-support@ampleforth.org
contract UniversalVault is IUniversalVault, ERC1271, Initializable, ExternalCall {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /* storage */

    struct LockData {
        address geyser;
        address powerSwitch;
        address token;
        uint256 balance;
    }

    uint256 private _lockNonce;
    mapping(bytes32 => LockData) private _locks;
    EnumerableSet.Bytes32Set private _lockSet;

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

    function owner() public view override(IUniversalVault, Ownable) returns (address ownerAddress) {
        return Ownable.owner();
    }

    function getGeyserLock(address geyser, address token) external view returns (uint256 balance) {
        return _locks[calculateLockID(geyser, token)].balance;
    }

    function getTokenLock(address token) external view returns (uint256 balance) {
        for (uint256 index; index < _lockSet.length(); index++) {
            LockData storage lockData = _locks[_lockSet.at(index)];
            if (lockData.token == token && lockData.balance > balance) balance = lockData.balance;
        }
        return balance;
    }

    function getLockNonce() external view returns (uint256 nonce) {
        return _lockNonce;
    }

    function checkBalances() public view returns (bool validity) {
        // iterate over all token locks and validate sufficient balance
        for (uint256 index; index < _lockSet.length(); index++) {
            // fetch storage lock reference
            LockData storage lockData = _locks[_lockSet.at(index)];
            // if insufficient balance and not shutdown, return false
            if (
                !IPowerSwitch(lockData.powerSwitch).isShutdown() &&
                IERC20(lockData.token).balanceOf(address(this)) < lockData.balance
            ) return false;
        }
        // if sufficient balance or shutdown, return true
        return true;
    }

    /* user functions */

    function transferOwnership(address newOwner) public override(IUniversalVault, Ownable) {
        Ownable.transferOwnership(newOwner);
    }

    /// @notice Perform an external call from the vault
    /// access control: only owner
    /// state machine: anytime
    /// state scope: none
    /// token transfer: transfer out amount limited by largest lock for given token
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
        // perform external call
        success = _externalCall(to, value, data, gas);
        // verify suficient token balance remaining
        require(checkBalances(), "Vault: insufficient balance locked");
        // explicit return
        return success;
    }

    // EOA -> geyser:Deposit() -> vault:Lock()
    function lock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            keccak256(abi.encodePacked("lock", msg.sender, token, amount, _lockNonce)),
            permission
        )
    {
        // validate sufficient balance
        require(IERC20(token).balanceOf(address(this)) >= amount, "Vault: insufficient balance");

        // get lock id
        bytes32 lockID = calculateLockID(msg.sender, token);

        // add lock to storage
        if (_lockSet.contains(lockID)) {
            // if lock already exists, increase amount
            _locks[lockID].balance += amount;
        } else {
            // if does not exist, create new lock
            // fetch power switch address
            address powerSwitch = IPowered(msg.sender).getPowerSwitch();
            // add lock to set
            assert(_lockSet.add(lockID));
            // add lock data to storage
            _locks[lockID] = LockData(msg.sender, token, powerSwitch, amount);
        }
    }

    // EOA -> geyser:Withdraw() -> vault:Unlock()
    function unlock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            keccak256(abi.encodePacked("unlock", msg.sender, token, amount, _lockNonce)),
            permission
        )
    {
        // validate sufficient balance
        require(IERC20(token).balanceOf(address(this)) >= amount, "Vault: insufficient balance");

        // get lock id
        bytes32 lockID = keccak256(abi.encodePacked(msg.sender, token));

        // validate existing lock
        require(_lockSet.contains(lockID), "Vault: invalid lock");

        // validate sufficient lock amount
        require(_locks[lockID].balance >= amount, "Vault: insufficient lock amount");

        // update lock data
        _locks[lockID].balance -= amount;
    }
}
