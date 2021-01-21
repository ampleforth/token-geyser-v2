// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ECDSA} from "@openzeppelin/contracts/cryptography/ECDSA.sol";

interface IERC1271 {
    function isValidSignature(bytes32 _messageHash, bytes memory _signature)
        external
        view
        returns (bytes4 magicValue);
}

/// @title ERC1271
/// @notice Wrapper for ERC1271 compatibility
/// @dev Security contact: dev-support@ampleforth.org
abstract contract ERC1271 is IERC1271 {
    using ECDSA for bytes32;

    // Valid magic value bytes4(keccak256("isValidSignature(bytes32,bytes)")
    bytes4 private constant VALID_SIG = 0x1626ba7e;
    // Invalid magic value
    bytes4 private constant INVALID_SIG = 0xffffffff;

    modifier onlyValidSignature(bytes32 messageHash, bytes memory signature) {
        require(
            isValidSignature(messageHash, signature) == VALID_SIG,
            "ERC1271: Invalid signature"
        );
        _;
    }

    function isValidSignature(bytes32 messageHash, bytes memory signature)
        public
        view
        override
        returns (bytes4)
    {
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        return signer == _getOwner() ? VALID_SIG : INVALID_SIG;
    }

    function _getOwner() internal view virtual returns (address owner);
}
