// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {ECDSA} from "@openzeppelin/contracts/cryptography/ECDSA.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

interface IERC1271 {
    function isValidSignature(bytes32 _messageHash, bytes memory _signature)
        external
        view
        returns (bytes4 magicValue);
}

/// @title ERC1271
/// @notice Module for ERC1271 compatibility
/// @dev Security contact: dev-support@ampleforth.org
abstract contract ERC1271 is IERC1271 {
    using ECDSA for bytes32;
    using Address for address;

    // Valid magic value bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 internal constant VALID_SIG = IERC1271.isValidSignature.selector;
    // Invalid magic value
    bytes4 internal constant INVALID_SIG = bytes4(0);

    modifier onlyValidSignature(bytes32 permissionHash, bytes memory signature) {
        require(
            isValidSignature(permissionHash, signature) == VALID_SIG,
            "ERC1271: Invalid signature"
        );
        _;
    }

    function _getOwner() internal view virtual returns (address owner);

    function isValidSignature(bytes32 permissionHash, bytes memory signature)
        public
        view
        override
        returns (bytes4)
    {
        address owner = _getOwner();
        if (owner.isContract()) {
            try IERC1271(owner).isValidSignature(permissionHash, signature) returns (
                bytes4 returnVal
            ) {
                return returnVal;
            } catch {
                return INVALID_SIG;
            }
        } else {
            address signer = permissionHash.recover(signature);
            return signer == owner ? VALID_SIG : INVALID_SIG;
        }
    }
}
