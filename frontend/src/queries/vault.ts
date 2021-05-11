import { gql } from '@apollo/client'

export const GET_USER_VAULTS = gql`
  query getUserVaults($id: ID!) {
    user(id: $id) {
      vaults {
        id
        nonce
        claimedReward {
          id
          token
          amount
          lastUpdate
        }
        locks {
          id
          geyser {
            id
          }
          token
          amount
          stakeUnits
          lastUpdate
        }
      }
    }
  }
`
