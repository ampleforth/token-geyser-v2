// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IFactory} from "./IFactory.sol";
import {Spawner} from "./Spawner.sol";
import {IUniversalVault} from "../UniversalVault.sol";

/// @title Vault Factory
/// @dev Security contact: dev-support@ampleforth.org
contract VaultFactory is IFactory, ERC721, Spawner {
    event VaultCreated(address vault);

    address private _template;

    constructor(address template) ERC721("Universal Vault v1", "VAULT-v1") {
        _template = template;
    }

    /* view functions */

    function created(address instance) external view override returns (bool validity) {
        return ERC721._exists(uint256(instance));
    }

    function instanceCount() external view override returns (uint256 count) {
        return ERC721.totalSupply();
    }

    function instanceAt(uint256 index) external view override returns (address instance) {
        return address(ERC721.tokenByIndex(index));
    }

    /* user functions */

    function create(bytes calldata) external override returns (address vault) {
        return _create();
    }

    function create2(bytes calldata, bytes32 salt) external override returns (address vault) {
        return _create2(salt);
    }

    function create() external returns (address vault) {
        return _create();
    }

    function create2(bytes32 salt) external returns (address vault) {
        return _create2(salt);
    }

    /* internal functions */

    function _create() internal returns (address instance) {
        instance = Spawner._spawn(
            msg.sender,
            _template,
            abi.encodeWithSelector(IUniversalVault.initialize.selector)
        );
        ERC721._safeMint(msg.sender, uint256(instance));
        emit VaultCreated(instance);
    }

    function _create2(bytes32 salt) internal returns (address instance) {
        instance = Spawner._spawnSalty(
            msg.sender,
            _template,
            abi.encodeWithSelector(IUniversalVault.initialize.selector),
            salt
        );
        ERC721._safeMint(msg.sender, uint256(instance));
        emit VaultCreated(instance);
    }

    /* getter functions */

    function getTemplate() external view returns (address template) {
        return _template;
    }
}
