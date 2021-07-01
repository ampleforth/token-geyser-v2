import { gql } from '@apollo/client'

export const GET_GEYSERS = gql`
  query getGeysers($ids: [ID!]!) {
    geysers(first: 1000, where: { id_in: $ids }) {
      id
      rewardToken
      stakingToken
      totalStake
      totalStakeUnits
      scalingFloor
      scalingCeiling
      scalingTime
      unlockedReward
      rewardSchedules(first: 1000) {
        id
        duration
        start
        rewardAmount
      }
      lastUpdate
      powerSwitch {
        id
        status
      }
    }
  }
`
