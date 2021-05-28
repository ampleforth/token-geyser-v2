import { gql } from '@apollo/client'

export const GET_GEYSERS = gql`
  query getGeysers {
    geysers(first: 1000) {
      id
      rewardToken
      stakingToken
      totalStake
      totalStakeUnits
      status
      scalingFloor
      scalingCeiling
      scalingTime
      unlockedReward
    }
  }
`
