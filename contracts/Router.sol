// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20Permit} from "./Libraries/IERC20Permit.sol";
import {TransferHelper} from "@uniswap/lib/contracts/libraries/TransferHelper.sol";

import {IGeyser} from "./Geyser.sol";
import {IUniversalVault} from "./UniversalVault.sol";
import {IFactory} from "./Factory/IFactory.sol";

/// @title Router
/// @notice Convenience contract for ampleforth geyser
/// @dev Security contact: dev-support@ampleforth.org
contract Router {
    function create2VaultAndStake(
        address geyser,
        address vaultFactory,
        address owner,
        uint256 amount,
        bytes32 salt,
        bytes calldata permission
    ) external returns (address vault) {
        // create vault
        vault = IFactory(vaultFactory).create2("", salt);
        // get staking token
        address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;
        // transfer ownership
        IERC721(vaultFactory).safeTransferFrom(address(this), owner, uint256(vault));
        // transfer tokens
        TransferHelper.safeTransferFrom(stakingToken, msg.sender, vault, amount);
        // stake
        IGeyser(geyser).stake(vault, amount, permission);
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

    function permitAndStake(
        address geyser,
        address vault,
        Permit calldata permit,
        bytes calldata permission
    ) external {
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
        address recipient;
        uint256 amount;
        bytes permission;
    }

    function unstakeMulti(UnstakeRequest[] calldata requests) external {
        for (uint256 index = 0; index < requests.length; index++) {
            UnstakeRequest calldata request = requests[index];
            IGeyser(request.geyser).unstakeAndClaim(
                request.vault,
                request.recipient,
                request.amount,
                request.permission
            );
        }
    }
}
