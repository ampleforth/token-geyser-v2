# token-geyser-v2-ui

## Known workarounds/oddities

- `let mounted = true in useEffect` is a workaround for supressing the warning saying that a state update on an unmounted component is not possible: https://stackoverflow.com/questions/53949393/cant-perform-a-react-state-update-on-an-unmounted-component
-  react-spring has a bug where floating point numbers are casted as integers on re-render (e.g. '1.0' gets shown as '1' on re-render). This is a temporary work-around, see https://github.com/pmndrs/react-spring/issues/1564

## Required Setup

### GraphQL Endpoint

To make sure that the application can fetch data from the subgraph,
the correct endpoint need to be passed to the GraphQL client.
Replace the value of `GEYSER_SUBGRAPH_NAME` under `src/constants.ts` with the name of the deployed subgraph.
The initialization of the GraphQL client can be found under `src/queries/client.ts`.

### Process Environment

Make sure that the environment variable `NODE_ENV` is set to something other than `development` when deploying to production.


## Geyser Specific Configuration

### List of Geysers

Under `src/config/geyser.ts`, it is possible to add or remove geysers that will be shown in the UI.
To add a geyser, append an object with the following properties to the `mainnetGeyserConfig` object:

```
name: string
address: string
stakingToken: StakingToken
rewardToken: RewardToken
```

The types `StakingToken` and `RewardToken` are explained below

### Staking Token

Staking tokens (LP tokens) will have customizable logic for calculating their price, displaying their symbol, displaying their name, etc. Staking tokens from V1 have been ported over. They are under `src/utils/stakingToken.ts`.

#### Adding a new staking token

To add a new staking token, first add a new member to the enum `StakingToken` under `src/constants.ts`.
Then, under `src/stakingToken.ts`, add a new case handler to the function `getStakingTokenInfo`,
and write a function that will return `Promise<StakingTokenInfo>`.

#### Example

Say we want to add a new staking token called `LP`. The following changes will need to be made:

Under `src/constants.ts`
```
export enum StakingToken {
  ...
  LP,
}
```

Under `src/stakingToken.ts`
```
export const getStakingTokenInfo = async (...) => {
  ...
  switch (token) {
    ...
    case StakingToken.LP:
      return getLP(tokenAddress, signerOrProvider)
    ...
  }
}

const getLP = async (...): Promise<StakingTokenInfo> => {
  ...
  return {
    address: '0x...',
    name: 'LP Token',
    ...
  }
}
```

### Reward Token

Similarly, reward tokens also have customizable logic. Currently, the only reward token is AMPL.

#### Adding a new reward token

To add a new reward token, first add a new member to the enum `RewardToken` under `src/constants.ts`.
Then, under `src/rewardToken.ts`, add a new case handler to the function `getRewardTokenInfo`,
and write a function that will return `Promise<RewardTokenInfo>`.

#### Example

Say we want to add a new reward token called `REW`. The following changes will need to be made:

Under `src/constants.ts`
```
export enum RewardToken {
  ...
  REW,
}
```

Under `src/rewardToken.ts`
```
export const getRewardTokenInfo = async (...) => {
  ...
  switch (token) {
    ...
    case RewardToken.REW:
      return getREW(tokenAddress, signerOrProvider)
    ...
  }
}

const getREW = async (...): Promise<RewardTokenInfo> => {
  ...
  return {
    address: '0x...',
    name: 'Reward Token',
    ...
  }
}
```

## Ethereum Provider

To use Infura as provider, replace the value of `INFURA_PROJECT_ID` under `src/constants.ts` with your Infura Project ID. This is only used for mainnet.

## Stats

User and geyser stats calculations are ported over from V1. The accounting math can be found under `src/utils/stats.ts`.

## Dev Specific Configuration

When working with MetaMask, it will expect a `chainId` or `networkId` of 1337 for local networks.
See `src/context/Web3Context.tsx` and search for `process.env.NODE_ENV === 'development'`,
those are the places where the `chainId` are explicitly set when in dev mode to connect to local network.

# Development and Deployment Documentation

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
