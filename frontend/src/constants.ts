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
export const POLL_INTERVAL = 5 * MS_PER_SEC

// pseudo permanent cache time
export const CONST_CACHE_TIME_MS = YEAR_IN_MS

// geyser stats cache time
export const GEYSER_STATS_CACHE_TIME_MS = MIN_IN_SEC

export const MOCK_ERC_20_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'

// Staking tokens
export enum StakingToken {
  // for testing
  MOCK,

  // for mainnet
  UNISWAP_V2,
  SUSHISWAP,
  MOONISWAP_V1,
  BALANCER_V1,
  BALANCER_SMART_POOL_V1,
}

// Reward tokens
export enum RewardToken {
  // for testing
  MOCK,

  // for mainnet
  AMPL,
}

// ufragments deploy block number
export const UFRG_INIT_BLOCK = 7947823

export const AMPL_LAUNCH_DATE = 1561687200
export const INITIAL_SUPPLY = 50000000

// alignment
export enum Align {
  LEFT,
  RIGHT,
  CENTER,
}
