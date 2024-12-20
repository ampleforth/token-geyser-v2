// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockVaultFactory is ERC721("MockVaultFactory", "MVF") {
    uint256 public nextVaultId;

    constructor() {
        nextVaultId = 1;
    }

    function create2(
        bytes calldata, /*args*/
        bytes32 /*salt*/
    ) external returns (address) {
        uint256 vaultId = nextVaultId;
        nextVaultId++;
        ERC721._safeMint(msg.sender, vaultId);
        return address(uint160(vaultId));
    }
}
