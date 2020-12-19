// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title ERC721Owner
/// @notice Wrapper for to user ERC721 for access control
/// @dev Security contact: dev-support@ampleforth.org
contract ERC721Owner {
    address private _nft;

    modifier onlyOwner() {
        require(getOwner() == msg.sender, "ERC721Owner: caller is not the owner");
        _;
    }

    function _setNFT(address nft) internal {
        _nft = nft;
    }

    function getNFT() public view virtual returns (address nft) {
        return _nft;
    }

    function getOwner() public view virtual returns (address owner) {
        return IERC721(_nft).ownerOf(uint256(address(this)));
    }
}
