// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/Initializable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import {ERC1271} from "./Access/ERC1271.sol";
import {EIP712} from "./Access/EIP712.sol";
import {OwnableERC721} from "./Access/OwnableERC721.sol";
import {IRageQuit} from "./Geyser.sol";

interface IUniversalVault {
    event Locked(address delegate, address token, uint256 amount);
    event Unlocked(address delegate, address token, uint256 amount);

    function initialize() external;

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

    function rageQuit(address delegate, address token)
        external
        returns (bool notified, string memory error);
}

interface IExternalCall {
    struct CallParams {
        address to;
        uint256 value;
        bytes data;
    }

    function externalCall(CallParams calldata call)
        external
        payable
        returns (bytes memory returnData);

    function externalCallMulti(CallParams[] calldata calls)
        external
        payable
        returns (bytes[] memory returnData);
}

/// @title UniversalVault
/// @notice Vault for isolated storage of staking tokens
/// @dev Warning: not compatible with rebasing tokens
/// @dev Security contact: dev-support@ampleforth.org
contract UniversalVault is
    IUniversalVault,
    IExternalCall,
    EIP712,
    ERC1271,
    OwnableERC721,
    Initializable
{
    using SafeMath for uint256;
    using Address for address;
    using Address for address payable;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /* constant */

    // Hardcoding a gas limit for rageQuit() is required to prevent gas DOS attacks
    // the gas requirement cannot be determined at runtime by querying the delegate
    // as it could potentially be manipulated by a malicious delegate who could force
    // the calls to revert.
    // The gas limit could alternatively be set upon vault initialization or creation
    // of a lock, but the gas consumption trade-offs are not favorable.
    // Ultimately, to avoid a need for fixed gas limits, the EVM would need to provide
    // an error code that allows for reliably catching out-of-gas errors on remote calls.
    uint256 public constant RAGEQUIT_GAS = 500000;

    /* storage */

    struct LockData {
        address delegate;
        address token;
        uint256 balance;
    }

    uint256 private _nonce;
    mapping(bytes32 => LockData) private _locks;
    EnumerableSet.Bytes32Set private _lockSet;

    /* events */
    event RageQuit(address delegate, address token, bool notified, string reason);

    /* initialization function */

    function initializeLock() external initializer {}

    function initialize() external override initializer {
        EIP712._setDomain("UniversalVault", "1.0.0");
        OwnableERC721._setNFT(msg.sender);
    }

    /* ether receive */

    receive() external payable {}

    /* internal overrides */

    function _getOwner() internal view override(ERC1271) returns (address ownerAddress) {
        return OwnableERC721.owner();
    }

    /* pure functions */

    function calculateLockID(address delegate, address token) public pure returns (bytes32 lockID) {
        return keccak256(abi.encodePacked(delegate, token));
    }

    /* private functions */

    function trimSelector(bytes memory data) private pure returns (bytes4 selector) {
        // manually unpack first 4 bytes
        // see: https://docs.soliditylang.org/en/v0.7.6/types.html#array-slices
        return data[0] | (bytes4(data[1]) >> 8) | (bytes4(data[2]) >> 16) | (bytes4(data[3]) >> 24);
    }

    /* getter functions */

    function getPermissionHash(
        bytes32 eip712TypeHash,
        address delegate,
        address token,
        uint256 amount,
        uint256 nonce
    ) public view returns (bytes32 permissionHash) {
        return
            EIP712._hashTypedDataV4(
                keccak256(abi.encode(eip712TypeHash, delegate, token, amount, nonce))
            );
    }

    function getNonce() external view returns (uint256 nonce) {
        return _nonce;
    }

    function owner()
        public
        view
        override(IUniversalVault, OwnableERC721)
        returns (address ownerAddress)
    {
        return OwnableERC721.owner();
    }

    function getLockSetCount() external view returns (uint256 count) {
        return _lockSet.length();
    }

    function getLockAt(uint256 index) external view returns (LockData memory lockData) {
        return _locks[_lockSet.at(index)];
    }

    function getBalanceDelegated(address token, address delegate)
        external
        view
        returns (uint256 balance)
    {
        return _locks[calculateLockID(delegate, token)].balance;
    }

    function getBalanceLocked(address token) external view returns (uint256 balance) {
        for (uint256 index; index < _lockSet.length(); index++) {
            LockData storage _lockData = _locks[_lockSet.at(index)];
            if (_lockData.token == token && _lockData.balance > balance)
                balance = _lockData.balance;
        }
        return balance;
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
    /// @param call Struct with call parameters (address to, uint256 value, bytes data)
    function externalCall(CallParams calldata call)
        external
        payable
        override
        onlyOwner
        returns (bytes memory returnData)
    {
        // perform external call
        returnData = _externalCall(call);
        // verify sufficient token balance remaining
        require(checkBalances(), "UniversalVault: insufficient balance locked");
        // explicit return
        return returnData;
    }

    /// @notice Perform multiple external calls from the vault
    /// access control: only owner
    /// state machine: anytime
    /// state scope: none
    /// token transfer: transfer out amount limited by largest lock for given token
    /// @param calls Array of Struct with call parameters (address to, uint256 value, bytes data)
    function externalCallMulti(CallParams[] calldata calls)
        external
        payable
        override
        onlyOwner
        returns (bytes[] memory returnData)
    {
        // perform external call
        for (uint256 index = 0; index < calls.length; index++) {
            returnData[index] = _externalCall(calls[index]);
        }
        // verify sufficient token balance remaining
        require(checkBalances(), "UniversalVault: insufficient balance locked");
        // explicit return
        return returnData;
    }

    /// @notice Lock ERC20 tokens in the vault
    /// access control: called by delegate with signed permission from owner
    /// state machine: anytime
    /// state scope:
    /// - insert or update _locks
    /// - increase _nonce
    /// token transfer: none
    /// @param token Address of token being locked
    /// @param amount Amount of tokens being locked
    /// @param permission Permission signature payload
    function lock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            getPermissionHash(
                keccak256("Lock(address delegate,address token,uint256 amount,uint256 nonce)"),
                msg.sender,
                token,
                amount,
                _nonce
            ),
            permission
        )
    {
        // get lock id
        bytes32 lockID = calculateLockID(msg.sender, token);

        // add lock to storage
        if (_lockSet.contains(lockID)) {
            // if lock already exists, increase amount
            _locks[lockID].balance = _locks[lockID].balance.add(amount);
        } else {
            // if does not exist, create new lock
            // add lock to set
            assert(_lockSet.add(lockID));
            // add lock data to storage
            _locks[lockID] = LockData(msg.sender, token, amount);
        }

        // validate sufficient balance
        require(
            IERC20(token).balanceOf(address(this)) >= _locks[lockID].balance,
            "UniversalVault: insufficient balance"
        );

        // increase nonce
        _nonce += 1;

        // emit event
        emit Locked(msg.sender, token, amount);
    }

    /// @notice Unlock ERC20 tokens in the vault
    /// access control: called by delegate with signed permission from owner
    /// state machine: after valid lock from delegate
    /// state scope:
    /// - remove or update _locks
    /// - increase _nonce
    /// token transfer: none
    /// @param token Address of token being unlocked
    /// @param amount Amount of tokens being unlocked
    /// @param permission Permission signature payload
    function unlock(
        address token,
        uint256 amount,
        bytes calldata permission
    )
        external
        override
        onlyValidSignature(
            getPermissionHash(
                keccak256("Unlock(address delegate,address token,uint256 amount,uint256 nonce)"),
                msg.sender,
                token,
                amount,
                _nonce
            ),
            permission
        )
    {
        // get lock id
        bytes32 lockID = calculateLockID(msg.sender, token);

        // validate existing lock
        require(_lockSet.contains(lockID), "UniversalVault: missing lock");

        // update lock data
        if (_locks[lockID].balance > amount) {
            // substract amount from lock balance
            _locks[lockID].balance = _locks[lockID].balance.sub(amount);
        } else {
            // delete lock data
            delete _locks[lockID];
            assert(_lockSet.remove(lockID));
        }

        // increase nonce
        _nonce += 1;

        // emit event
        emit Unlocked(msg.sender, token, amount);
    }

    /// @notice Forcibly cancel delegate lock
    /// @dev This function will attempt to notify the delegate of the rage quit using
    ///      a fixed amount of gas.
    /// access control: only owner
    /// state machine: after valid lock from delegate
    /// state scope:
    /// - remove item from _locks
    /// token transfer: none
    /// @param delegate Address of delegate
    /// @param token Address of token being unlocked
    function rageQuit(address delegate, address token)
        external
        override
        onlyOwner
        returns (bool notified, string memory error)
    {
        // get lock id
        bytes32 lockID = calculateLockID(delegate, token);

        // validate existing lock
        require(_lockSet.contains(lockID), "UniversalVault: missing lock");

        // attempt to notify delegate
        if (delegate.isContract()) {
            // check for sufficient gas
            require(gasleft() >= RAGEQUIT_GAS, "UniversalVault: insufficient gas");

            // attempt rageQuit notification
            try IRageQuit(delegate).rageQuit{gas: RAGEQUIT_GAS}() {
                notified = true;
            } catch Error(string memory res) {
                notified = false;
                error = res;
            } catch (bytes memory) {
                notified = false;
            }
        }

        // update lock storage
        assert(_lockSet.remove(lockID));
        delete _locks[lockID];

        // emit event
        emit RageQuit(delegate, token, notified, error);
    }

    /* convenience functions */

    function _externalCall(CallParams calldata call) private returns (bytes memory returnData) {
        if (call.data.length > 0) {
            // sanity check calldata
            require(call.data.length >= 4, "UniversalVault: calldata too short");
            // blacklist ERC20 approval
            require(
                trimSelector(call.data) != IERC20.approve.selector,
                "UniversalVault: cannot make ERC20 approval"
            );
            // perform external call
            returnData = call.to.functionCallWithValue(call.data, call.value);
        } else {
            // perform external call
            payable(call.to).sendValue(call.value);
        }
    }
}
