export const BILL_BROKER_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InvalidARBound',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidPerc',
    type: 'error',
  },
  {
    inputs: [],
    name: 'SlippageTooHigh',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnacceptableSwap',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnauthorizedCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnexpectedARDelta',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnexpectedDecimals',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UnreliablePrice',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'version',
        type: 'uint8',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DECIMALS',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MINIMUM_LIQUIDITY',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ONE',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'arHardBound',
    outputs: [
      {
        internalType: 'uint256',
        name: 'lower',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'upper',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'arSoftBound',
    outputs: [
      {
        internalType: 'uint256',
        name: 'lower',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'upper',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'usdBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'usdPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpPrice',
            type: 'uint256',
          },
        ],
        internalType: 'struct ReserveState',
        name: 's',
        type: 'tuple',
      },
    ],
    name: 'assetRatio',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'burnFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtMax',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtMax',
        type: 'uint256',
      },
    ],
    name: 'computeMintAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'mintAmt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'usdAmtIn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtIn',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isFirstMint',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtIn',
        type: 'uint256',
      },
    ],
    name: 'computePerpToUSDSwapAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtIn',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'usdBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'usdPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpPrice',
            type: 'uint256',
          },
        ],
        internalType: 'struct ReserveState',
        name: 's',
        type: 'tuple',
      },
    ],
    name: 'computePerpToUSDSwapAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lpFeeUsdAmt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'protocolFeeUsdAmt',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'arPre',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'arPost',
        type: 'uint256',
      },
    ],
    name: 'computePerpToUSDSwapFeePerc',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'burnAmt',
        type: 'uint256',
      },
    ],
    name: 'computeRedemptionAmts',
    outputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtIn',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'usdBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'usdPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpPrice',
            type: 'uint256',
          },
        ],
        internalType: 'struct ReserveState',
        name: 's',
        type: 'tuple',
      },
    ],
    name: 'computeUSDToPerpSwapAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lpFeePerpAmt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'protocolFeePerpAmt',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtIn',
        type: 'uint256',
      },
    ],
    name: 'computeUSDToPerpSwapAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'arPre',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'arPost',
        type: 'uint256',
      },
    ],
    name: 'computeUSDToPerpSwapFeePerc',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'subtractedValue',
        type: 'uint256',
      },
    ],
    name: 'decreaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtMax',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtMax',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'usdAmtMin',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtMin',
        type: 'uint256',
      },
    ],
    name: 'deposit',
    outputs: [
      {
        internalType: 'uint256',
        name: 'mintAmt',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fees',
    outputs: [
      {
        internalType: 'uint256',
        name: 'mintFeePerc',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'burnFeePerc',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'lower',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'upper',
            type: 'uint256',
          },
        ],
        internalType: 'struct Range',
        name: 'perpToUSDSwapFeePercs',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'lower',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'upper',
            type: 'uint256',
          },
        ],
        internalType: 'struct Range',
        name: 'usdToPerpSwapFeePercs',
        type: 'tuple',
      },
      {
        internalType: 'uint256',
        name: 'protocolSwapSharePerc',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'addedValue',
        type: 'uint256',
      },
    ],
    name: 'increaseAllowance',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'symbol',
        type: 'string',
      },
      {
        internalType: 'contract IERC20Upgradeable',
        name: 'usd_',
        type: 'address',
      },
      {
        internalType: 'contract IPerpetualTranche',
        name: 'perp_',
        type: 'address',
      },
      {
        internalType: 'contract ISpotPricingStrategy',
        name: 'pricingStrategy_',
        type: 'address',
      },
    ],
    name: 'init',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'keeper',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'perp',
    outputs: [
      {
        internalType: 'contract IPerpetualTranche',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'perpBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'perpPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'perpUnitAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pricingStrategy',
    outputs: [
      {
        internalType: 'contract ISpotPricingStrategy',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'protocolFeeCollector',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'burnAmt',
        type: 'uint256',
      },
    ],
    name: 'redeem',
    outputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtOut',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveState',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'usdBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpBalance',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'usdPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'perpPrice',
            type: 'uint256',
          },
        ],
        internalType: 'struct ReserveState',
        name: 's',
        type: 'tuple',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtIn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'usdAmtMin',
        type: 'uint256',
      },
    ],
    name: 'swapPerpsForUSD',
    outputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'usdAmtIn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'perpAmtMin',
        type: 'uint256',
      },
    ],
    name: 'swapUSDForPerps',
    outputs: [
      {
        internalType: 'uint256',
        name: 'perpAmtOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'lower',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'upper',
            type: 'uint256',
          },
        ],
        internalType: 'struct Range',
        name: 'arSoftBound_',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'lower',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'upper',
            type: 'uint256',
          },
        ],
        internalType: 'struct Range',
        name: 'arHardBound_',
        type: 'tuple',
      },
    ],
    name: 'updateARBounds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'mintFeePerc',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'burnFeePerc',
            type: 'uint256',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'lower',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'upper',
                type: 'uint256',
              },
            ],
            internalType: 'struct Range',
            name: 'perpToUSDSwapFeePercs',
            type: 'tuple',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'lower',
                type: 'uint256',
              },
              {
                internalType: 'uint256',
                name: 'upper',
                type: 'uint256',
              },
            ],
            internalType: 'struct Range',
            name: 'usdToPerpSwapFeePercs',
            type: 'tuple',
          },
          {
            internalType: 'uint256',
            name: 'protocolSwapSharePerc',
            type: 'uint256',
          },
        ],
        internalType: 'struct BillBrokerFees',
        name: 'fees_',
        type: 'tuple',
      },
    ],
    name: 'updateFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'keeper_',
        type: 'address',
      },
    ],
    name: 'updateKeeper',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract ISpotPricingStrategy',
        name: 'pricingStrategy_',
        type: 'address',
      },
    ],
    name: 'updatePricingStrategy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usd',
    outputs: [
      {
        internalType: 'contract IERC20Upgradeable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdUnitAmt',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
