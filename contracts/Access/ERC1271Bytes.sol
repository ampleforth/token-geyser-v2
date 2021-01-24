// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;

import {ECDSA} from "@openzeppelin/contracts/cryptography/ECDSA.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IERC1271, ERC1271} from "./ERC1271.sol";

interface IERC1271Bytes {
    function isValidSignature(bytes calldata _message, bytes memory _signature)
        external
        view
        returns (bytes4 magicValue);
}

abstract contract ERC1271Bytes is IERC1271Bytes, ERC1271 {
    using ECDSA for bytes32;
    using Address for address;

    // Valid magic value bytes4(keccak256("isValidSignature(bytes,bytes)")
    bytes4 internal constant VALID_SIG_BYTES = IERC1271Bytes.isValidSignature.selector;
    // Invalid magic value
    bytes4 internal constant INVALID_SIG_BYTES = bytes4(0);

    modifier onlyValidSignatureBytes(bytes memory permission, bytes memory signature) {
        require(
            isValidSignature(permission, signature) == VALID_SIG_BYTES,
            "ERC1271Bytes: Invalid signature"
        );
        _;
    }

    function _getOwner() internal view virtual override returns (address owner);

    function isValidSignature(bytes memory permission, bytes memory signature)
        public
        view
        override
        returns (bytes4)
    {
        address owner = _getOwner();
        if (owner.isContract()) {
            bool validBytes;
            try IERC1271Bytes(owner).isValidSignature(permission, signature) returns (
                bytes4 returnVal
            ) {
                validBytes = returnVal == VALID_SIG_BYTES;
            } catch {}

            bool validHash =
                ERC1271.isValidSignature(keccak256(permission), signature) == ERC1271.VALID_SIG;

            return validBytes || validHash ? VALID_SIG_BYTES : INVALID_SIG_BYTES;
        } else {
            address signer = keccak256(permission).toEthSignedMessageHash().recover(signature);
            return signer == owner ? VALID_SIG_BYTES : INVALID_SIG_BYTES;
        }
    }
}
