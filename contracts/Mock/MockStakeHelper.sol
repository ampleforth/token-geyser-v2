// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.5;
pragma abicoder v2;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGeyser} from "../Geyser.sol";
import {IVault} from "../Vault.sol";

contract MockStakeHelper {
    function flashStake(
        address vault,
        address geyser,
        uint256 amount,
        bytes calldata depositPermission,
        bytes calldata withdrawPermission
    ) external {
        // get staking token
        address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;

        // transfer amount in
        IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);

        // create vault and deposit
        IERC20(stakingToken).approve(geyser, amount);
        IGeyser(geyser).deposit(vault, amount, depositPermission);

        // withdraw
        IGeyser(geyser).withdraw(vault, msg.sender, amount, withdrawPermission);
    }

    // function multiCreateAndDeposit(address geyser, uint256 amount)
    //     external
    //     returns (address[10] memory vaults)
    // {
    //     // get staking token
    //     address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;

    //     // make deposits
    //     for (uint256 index = 0; index < 10; index++) {
    //         // transfer amount in
    //         IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);

    //         // create vault and deposit
    //         IERC20(stakingToken).approve(geyser, amount);
    //         vaults[index] = IGeyser(geyser).createVaultAndDeposit(amount);

    //         // transfer ownership
    //         IVault(vaults[index]).transferOwnership(msg.sender);
    //     }
    // }

    function multiStake(
        address vault,
        address geyser,
        uint256 amount,
        bytes[] calldata permissions
    ) external {
        // get staking token
        address stakingToken = IGeyser(geyser).getGeyserData().stakingToken;

        // make deposits
        for (uint256 index = 0; index < permissions.length; index++) {
            // transfer amount in
            IERC20(stakingToken).transferFrom(msg.sender, address(this), amount);

            // create vault and deposit
            IERC20(stakingToken).approve(geyser, amount);
            IGeyser(geyser).deposit(vault, amount, permissions[index]);
        }
    }
}
