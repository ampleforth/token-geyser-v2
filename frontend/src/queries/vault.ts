import { gql } from '@apollo/client'

export const GET_USER_VAULTS = gql`
  query getUserVaults($id: ID!) {
    user(id: $id) {
      vaults(first: 1000) {
        id
        nonce
        claimedReward(first: 1000) {
          id
          token
          amount
          lastUpdate
        }
        locks(first: 1000) {
          id
          token
          amount
          stakeUnits
          lastUpdate
        }
      }
    }
  }
`
