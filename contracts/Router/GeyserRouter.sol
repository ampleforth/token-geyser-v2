// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IERC20Permit} from "@openzeppelin/contracts/drafts/IERC20Permit.sol";
import {TransferHelper} from "@uniswap/lib/contracts/libraries/TransferHelper.sol";

import {IGeyser} from "../Geyser.sol";
import {IUniversalVault} from "../UniversalVault.sol";
import {IFactory} from "../Factory/IFactory.sol";

/// @title GeyserRouter
/// @notice Convenience contract for ampleforth geyser
/// @dev Security contact: dev-support@ampleforth.org
contract GeyserRouter is IERC721Receiver {
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function create2Vault(
        address vaultFactory,
        bytes32 salt,
        address vaultOwner
    ) public returns (address vault) {
        // create vault
        vault = IFactory(vaultFactory).create2("", salt);
        // transfer ownership
        IERC721(vaultFactory).safeTransferFrom(address(this), vaultOwner, uint256(vault));
    }

    function depositStake(
        address geyser,
        address vault,
        uint256 amount,
        bytes calldata permission
    ) public {
        address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;
        TransferHelper.safeTransferFrom(stakingToken, msg.sender, vault, amount);
        IGeyser(geyser).stake(vault, amount, permission);
    }

    function create2VaultAndStake(
        address geyser,
        address vaultFactory,
        address vaultOwner,
        uint256 amount,
        bytes32 salt,
        bytes calldata permission
    ) external returns (address vault) {
        vault = create2Vault(vaultFactory, salt, vaultOwner);
        // transfer tokens and stake
        depositStake(geyser, vault, amount, permission);
    }

    struct Permit {
        address owner;
        address spender;
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function create2VaultPermitAndStake(
        address geyser,
        address vaultFactory,
        address vaultOwner,
        bytes32 salt,
        Permit calldata permit,
        bytes calldata permission
    ) external returns (address vault) {
        // create vault
        vault = IFactory(vaultFactory).create2("", salt);
        // transfer ownership
        IERC721(vaultFactory).safeTransferFrom(address(this), vaultOwner, uint256(vault));
        // permit and stake
        permitAndStake(geyser, vault, permit, permission);
        // return vault
        return vault;
    }

    function permitAndStake(
        address geyser,
        address vault,
        Permit calldata permit,
        bytes calldata permission
    ) public {
        // get staking token
        address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;
        // permit transfer
        IERC20Permit(stakingToken).permit(
            permit.owner,
            permit.spender,
            permit.value,
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        );
        // transfer tokens
        TransferHelper.safeTransferFrom(stakingToken, msg.sender, vault, permit.value);
        // stake
        IGeyser(geyser).stake(vault, permit.value, permission);
    }

    struct StakeRequest {
        address geyser;
        address vault;
        uint256 amount;
        bytes permission;
    }

    function stakeMulti(StakeRequest[] calldata requests) external {
        for (uint256 index = 0; index < requests.length; index++) {
            StakeRequest calldata request = requests[index];
            IGeyser(request.geyser).stake(request.vault, request.amount, request.permission);
        }
    }

    struct UnstakeRequest {
        address geyser;
        address vault;
        uint256 amount;
        bytes permission;
    }

    function unstakeMulti(UnstakeRequest[] calldata requests) external {
        for (uint256 index = 0; index < requests.length; index++) {
            UnstakeRequest calldata request = requests[index];
            IGeyser(request.geyser).unstakeAndClaim(request.vault, request.amount, request.permission);
        }
    }

    function unstakeAndRestake(UnstakeRequest calldata r1, StakeRequest calldata r2) external {
        IGeyser(r1.geyser).stake(r1.vault, r1.amount, r1.permission);
        IGeyser(r2.geyser).unstakeAndClaim(r2.vault, r2.amount, r2.permission);
    }
}
