// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {IFactory} from "./IFactory.sol";
import {CloneFactory} from "./CloneFactory.sol";
import {UniversalVault} from "../UniversalVault.sol";

/// @title Vault Factory
/// @dev Security contact: dev-support@ampleforth.org
contract VaultFactory is IFactory, ERC721, CloneFactory {
    address public template;

    constructor() ERC721("Universal Vaults", "UniVault") {
        template = address(new UniversalVault());
    }

    function create(bytes calldata args) external override returns (address vault) {
        vault = CloneFactory._create(template, args);
        ERC721._safeMint(msg.sender, uint256(vault));
        return vault;
    }

    function create2(bytes calldata args, bytes32 salt) external override returns (address vault) {
        vault = CloneFactory._createSalty(template, args, salt);
        ERC721._safeMint(msg.sender, uint256(vault));
        return vault;
    }
}
