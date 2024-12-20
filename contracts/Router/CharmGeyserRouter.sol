// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {GeyserRouter, TransferHelper, IERC20, IERC721, IGeyser} from "./GeyserRouter.sol";

/// @notice Interface for a Charm LP token
interface ICharmLiqToken is IERC20 {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function deposit(
        uint256,
        uint256,
        uint256,
        uint256,
        address
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );
}

/// @title CharmGeyserRouter
/// @notice Convenience contract to stake Charm LP tokens on geysers
/// @dev Security contact: dev-support@ampleforth.org
contract CharmGeyserRouter is GeyserRouter {
    using TransferHelper for address;

    struct LiqCreationPayload {
        uint256 token0Amt;
        uint256 token1Amt;
        uint256 token0MinAmt;
        uint256 token1MinAmt;
    }

    function createLiqAndStake(
        address geyser,
        address vault,
        bytes calldata permission,
        LiqCreationPayload memory d
    ) public {
        // Expects the geyser's staking token to be a Charm liquidity token
        ICharmLiqToken charm = ICharmLiqToken(IGeyser(geyser).getGeyserData().stakingToken);
        address depositToken0 = charm.token0();
        address depositToken1 = charm.token1();

        // Get deposit tokens from user
        depositToken0.safeTransferFrom(msg.sender, address(this), d.token0Amt);
        depositToken1.safeTransferFrom(msg.sender, address(this), d.token1Amt);

        // Creates a charm liquidity position and
        // transfers liquidity tokens directly to the vault
        _checkAndApproveMax(depositToken0, address(charm), d.token0Amt);
        _checkAndApproveMax(depositToken1, address(charm), d.token1Amt);
        (uint256 lpAmt, , ) = charm.deposit(d.token0Amt, d.token1Amt, d.token0MinAmt, d.token1MinAmt, vault);

        // Stake liquidity tokens from the vault
        IGeyser(geyser).stake(vault, lpAmt, permission);

        // Transfer any remaining dust deposit tokens
        _transferAll(depositToken0, msg.sender);
        _transferAll(depositToken1, msg.sender);
    }

    function create2VaultCreateLiqAndStake(
        address geyser,
        address vaultFactory,
        address vaultOwner,
        bytes32 salt,
        bytes calldata permission,
        LiqCreationPayload memory d
    ) external returns (address vault) {
        vault = create2Vault(vaultFactory, salt, vaultOwner);
        // create liquidity and stake
        createLiqAndStake(geyser, vault, permission, d);
    }

    /// @dev Checks if the spender has sufficient allowance. If not, approves the maximum possible amount.
    function _checkAndApproveMax(
        address token,
        address spender,
        uint256 amount
    ) private {
        uint256 allowance = IERC20(token).allowance(address(this), spender);
        if (allowance < amount) {
            IERC20(token).approve(spender, type(uint256).max);
        }
    }

    /// @dev Transfers the entire token balance to the given address.
    function _transferAll(address token, address to) private {
        token.safeTransfer(to, IERC20(token).balanceOf(address(this)));
    }
}
