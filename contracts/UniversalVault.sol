// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";

import {ERC1271} from "./Access/ERC1271.sol";
import {ERC721Owner} from "./Access/ERC721Owner.sol";
import {ExternalCall} from "./ExternalCall/ExternalCall.sol";

interface IRageQuit {
    function rageQuit() external;
}

interface IUniversalVault {
    function getOwner() external view returns (address owner);

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

    function rageQuit(address geyser, address token)
        external
        returns (bool notified, string memory reason);
}

/// @title UniversalVault
/// @notice Vault for isolated storage of staking tokens
/// @dev Security contact: dev-support@ampleforth.org
contract UniversalVault is IUniversalVault, ERC1271, ERC721Owner, ExternalCall {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /* storage */

    struct LockData {
        address geyser;
        address token;
        uint256 balance;
    }

    uint256 private _lockNonce;
    mapping(bytes32 => LockData) private _locks;
    EnumerableSet.Bytes32Set private _lockSet;

    /* events */

    event Locked(address geyser, address token, uint256 amount);
    event Unlocked(address geyser, address token, uint256 amount);
    event RageQuit(address geyser, address token, bool notified, string reason);

    /* internal overrides */

    function _getOwner() internal view override(ERC1271) returns (address owner) {
        return ERC721Owner.getOwner();
    }

    /* pure functions */

    function calculateLockID(address geyser, address token) public pure returns (bytes32 lockID) {
        return keccak256(abi.encodePacked(geyser, token));
    }

    /* getter functions */

    function getOwner() public view override(IUniversalVault, ERC721Owner) returns (address owner) {
        return ERC721Owner.getOwner();
    }

    function getGeyserLock(address geyser, address token) external view returns (uint256 balance) {
        return _locks[calculateLockID(geyser, token)].balance;
    }

    function getTokenLock(address token) external view returns (uint256 balance) {
        for (uint256 index; index < _lockSet.length(); index++) {
            LockData storage _lockData = _locks[_lockSet.at(index)];
            if (_lockData.token == token && _lockData.balance > balance)
                balance = _lockData.balance;
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
            LockData storage _lockData = _locks[_lockSet.at(index)];
            // if insufficient balance and not shutdown, return false
            if (IERC20(_lockData.token).balanceOf(address(this)) < _lockData.balance) return false;
        }
        // if sufficient balance or shutdown, return true
        return true;
    }

    /* user functions */

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
        // verify sufficient token balance remaining
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
            // add lock to set
            assert(_lockSet.add(lockID));
            // add lock data to storage
            _locks[lockID] = LockData(msg.sender, token, amount);
        }

        // emit event
        emit Locked(msg.sender, token, amount);
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

        // emit event
        emit Unlocked(msg.sender, token, amount);
    }

    function rageQuit(address geyser, address token)
        external
        override
        returns (bool notified, string memory reason)
    {
        // get lock id
        bytes32 lockID = calculateLockID(geyser, token);

        // validate existing lock
        require(_lockSet.contains(lockID), "Vault: invalid lock");

        // attempt to notify geyser
        try IRageQuit(geyser).rageQuit()  {
            notified = true;
        } catch Error(string memory res) {
            notified = false;
            reason = res;
        } catch (bytes memory) {
            notified = false;
        }

        // update lock storage
        assert(_lockSet.remove(lockID));
        delete _locks[lockID];

        // emit event
        emit RageQuit(geyser, token, notified, reason);
    }
}
