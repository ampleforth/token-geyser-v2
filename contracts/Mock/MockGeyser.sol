// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.7.6;
pragma abicoder v2;

import {IGeyser} from "../Geyser.sol";

contract MockGeyser {
    address public stakingToken;

    constructor(address _stakingToken) {
        stakingToken = _stakingToken;
    }

    function getGeyserData() external view returns (IGeyser.GeyserData memory) {
        IGeyser.RewardSchedule[] memory rewardSchedules;
        return
            IGeyser.GeyserData({
                stakingToken: stakingToken,
                rewardToken: address(0),
                rewardPool: address(0),
                rewardScaling: IGeyser.RewardScaling({floor: 0, ceiling: 0, time: 0}),
                rewardSharesOutstanding: 0,
                totalStake: 0,
                totalStakeUnits: 0,
                lastUpdate: 0,
                rewardSchedules: rewardSchedules
            });
    }

    event LogStaked(address vault, uint256 amount, bytes permission);

    function stake(
        address vault,
        uint256 amount,
        bytes calldata permission
    ) external {
        emit LogStaked(vault, amount, permission);
    }
}
