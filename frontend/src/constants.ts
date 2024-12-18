const MS_PER_SEC = 1000

export const MIN_IN_SEC = 60
export const HOUR_IN_SEC = 60 * MIN_IN_SEC
export const DAY_IN_SEC = 24 * HOUR_IN_SEC
export const WEEK_IN_SEC = 7 * DAY_IN_SEC
export const MONTH_IN_SEC = 30 * DAY_IN_SEC
export const YEAR_IN_SEC = 365 * DAY_IN_SEC

export const MIN_IN_MS = MIN_IN_SEC * MS_PER_SEC
export const HOUR_IN_MS = HOUR_IN_SEC * MS_PER_SEC
export const DAY_IN_MS = DAY_IN_SEC * MS_PER_SEC
export const WEEK_IN_MS = WEEK_IN_SEC * MS_PER_SEC
export const MONTH_IN_MS = MONTH_IN_SEC * MS_PER_SEC
export const YEAR_IN_MS = YEAR_IN_SEC * MS_PER_SEC

// polling interval for querying subgraph
export const POLL_INTERVAL = 60 * MS_PER_SEC

// pseudo permanent cache time
export const CONST_CACHE_TIME_MS = YEAR_IN_MS

// geyser stats cache time
export const GEYSER_STATS_CACHE_TIME_MS = 900 * MS_PER_SEC

export const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

// app mode
export enum Mode {
  VAULTS,
  GEYSERS,
}

// transaction state
export enum TxState {
  PENDING,
  SUBMITTED,
  MINED,
  FAILED,
}

// Staking tokens
export enum StakingToken {
  // for testing
  MOCK,
  WAMPL,

  // for mainnet
  UNISWAP_V2,
  SUSHISWAP,
  MOONISWAP_V1,
  BALANCER_V1,
  BALANCER_SMART_POOL_V1,
  AAVE_V2_AMPL,
  TRADER_JOE,
  PANGOLIN,
  BALANCER_WEIGHTED_POOL_V2,
  ARRAKIS_V1,
  CHARM_V1,
  BILL_BROKER,
}

// Reward tokens
export enum RewardToken {
  // for testing
  MOCK,

  // for mainnet
  AMPL,
  XCAMPLE,
  WAMPL,
  SPOT,
  FORTH,
}

// Netowrks
export enum Network {
  Mainnet = 1,
  Kovan = 42,
  Avalanche = 43114,
}

// Platforms
export enum Platform {
  Ampleforth,
  Charm,
  Uniswap,
  Balancer,
  Sushiswap,
  Arrakis,
  Aave,
}

export const AMPL_LAUNCH_DATE = 1561687200
export const INITIAL_SUPPLY = 50000000

export const GET_APY_STAKE_MSG = () =>
  'The aggregate staking APY is an estimate based on two components: fees from liquidity provisioning and rewards from geyser emissions. This figure does not account for potential gains or losses associated with holding liquidity tokens.'

export const GET_APY_WARN_MSG = () =>
  '1) The LP APY is estimated by annualizing the yield from swap fees generated over the past 30 days. 2) The geyser drip rate assumes that you have reached the max multiplier.'

export const GET_REWARD_MULTIPLIER_MSG = ({ days = '30', multiplier = '3.0' }) =>
  `Stake at-least ${days} days to achieve a ${multiplier}x reward multiplier.`

export const DRIP_RATE_MSG = () =>
  `The estimated reward rate for staking in this geyser, value staked to reward value out. Rewards will continue to drip until the current program is active.`

export const UNIVERSAL_VAULT_MSG = () =>
  'This is an on chain escrow contract which holds all your staked tokens and claimed rewards. You can withdraw all unlocked tokens to your wallet at any time. To withdraw locked tokens, first unstake from any active distribution programs.'

export const CURRENT_REWARDS_MSG = () =>
  'The total dollar denominated value of reward tokens you have accrued thus far. Your rewards depend on the both size and length of your stake.'

export const TOTAL_REWARDS_MSG = () => 'The total dollar denominated value of reward tokens allocated to this geyser.'

// alignment
export enum Align {
  LEFT,
  RIGHT,
  CENTER,
}

// Alchemy
export const ALCHEMY_PROJECT_ID =
  process.env.NODE_ENV === 'development' ? process.env.REACT_APP_ALCHEMY_PROJECT_ID : 'ZHxuumw69-t77RswGL845CVVHQYja1bG'

// Infura
export const INFURA_PROJECT_ID = 'dee1a87a734042fcabc2fd116a7b776d'

// Enable withdrawing whole unlocked balance of staking tokens when unstaking
export const WITHDRAW_UNLOCKED_STAKING_TOKENS_WHEN_UNSTAKING = false

// Enable withdrawing whole unlocked balance of reward tokens when unstaking
export const WITHDRAW_UNLOCKED_REWARD_TOKENS_WHEN_UNSTAKING = false
