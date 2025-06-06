import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { Geyser, TokenInfo, GeyserConfig, Vault, GeyserInfo, GeyserAction, BonusTokenInfo } from 'types'
import { getTokenInfo } from 'utils/token'
import { getBonusTokenInfo } from 'utils/bonusToken'
import { defaultStakingTokenInfo, getStakingTokenInfo } from 'utils/stakingToken'
import { approveCreateDepositStake, approveDepositStake, unstake } from 'sdk'
import { wrap, unwrap } from 'utils/wrap'
import { GET_GEYSERS } from 'queries/geyser'
import { defaultRewardTokenInfo, getRewardTokenInfo } from 'utils/rewardToken'
import { getGeyserStats, clearGeyserStatsCache, clearUserStatsCache } from 'utils/stats'
import { getGeysersConfigList, getAdditionalTokensList } from 'config/app'
import { loadStakeAPYsFromCache } from 'utils/ampleforth'
import Web3Context from './Web3Context'
import { POLL_INTERVAL } from '../constants'
import { sleep } from '../components/PageLoader'

export const GeyserContext = createContext<{
  geysers: Geyser[]
  selectedGeyserInfo: GeyserInfo
  selectGeyser: (geyser: Geyser) => void
  selectGeyserById: (id: string) => void
  getGeyserSlugByName: (name: string) => string
  selectGeyserBySlug: (name: string) => Promise<boolean>
  geyserAction: GeyserAction
  updateGeyserAction: (a: GeyserAction) => void
  handleStakeUnstake: (arg0: Vault | null, arg1: BigNumber) => Promise<TransactionResponse | undefined>
  handleWrapping: (
    arg0: string,
    arg1: string,
    arg2: BigNumber,
    arg4: boolean,
    arg5: Vault | null,
    arg6: boolean,
  ) => Promise<TransactionResponse | undefined>
  allTokensInfos: TokenInfo[]
  getGeyserConfig: (id: string) => GeyserConfig | null
  getDefaultGeyserConfig: () => GeyserConfig | null 
  getGeyserName: (id: string) => string
  selectedGeyserConfig: GeyserConfig | null
  stakeAPYs: Record<string, Record<string, number>>
  loading: boolean
}>({
  geysers: [],
  selectedGeyserInfo: {
    geyser: null,
    stakingTokenInfo: defaultStakingTokenInfo(),
    rewardTokenInfo: defaultRewardTokenInfo(),
    bonusTokensInfo: [],
    isWrapped: false,
  },
  selectGeyser: () => {},
  selectGeyserById: () => {},
  getGeyserSlugByName: () => '',
  selectGeyserBySlug: () => Promise.resolve(false),
  geyserAction: GeyserAction.STAKE,
  updateGeyserAction: () => {},
  handleStakeUnstake: async () => undefined,
  handleWrapping: async () => undefined,
  allTokensInfos: [],
  getGeyserConfig: (id: string) => { return (null) },
  getDefaultGeyserConfig: () => { return (null) },
  getGeyserName: () => '',
  selectedGeyserConfig: null,
  stakeAPYs: {},
  loading: false,
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { signer, provider, networkId } = useContext(Web3Context)
  const signerOrProvider = signer || provider

  // Polling to fetch fresh geyser stats
  const [dataLoading, setDataLoading] = useState<boolean>(false)
  const [getGeysers, { loading: geyserLoading, data: geyserData }] = useLazyQuery(GET_GEYSERS, {
    pollInterval: POLL_INTERVAL,
  })
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyserInfo, setSelectedGeyserInfo] = useState<GeyserInfo>({
    geyser: null,
    stakingTokenInfo: defaultStakingTokenInfo(),
    rewardTokenInfo: defaultRewardTokenInfo(),
    bonusTokensInfo: [],
    isWrapped: false,
  })

  const [selectedGeyserConfig, setSelectedGeyserConfig] = useState<GeyserConfig | null>(null)
  const [allTokensInfos, setAllTokensInfos] = useState<TokenInfo[]>([])
  const [stakeAPYs, setStakeAPYs] = useState<Record<string, Record<string, number>>>({})

  const [geyserAction, setAction] = useState<GeyserAction>(GeyserAction.STAKE)
  const updateGeyserAction = (a: GeyserAction) => setAction(a)

  const setupGeysers = async () => {
    const currentGeysers = [...geyserData.geysers].map((geyser) => ({
      ...geyser,
      status: geyser.powerSwitch.status,
    })) as Geyser[]
    const geyserConfigs = getGeysersConfigList(networkId)
    const ids = geyserConfigs.map((geyser) => geyser.address.toLowerCase())
    currentGeysers.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    setGeysers(currentGeysers)
    ;(async () => {
      try {
        // staking and reward tokens might have custom logic for name / symbol
        const geyserAddressToConfig = new Map(
          geyserConfigs.map(({ address, stakingToken, rewardToken }) => [
            toChecksumAddress(address),
            { stakingToken, rewardToken },
          ]),
        )

        const geyserTokens = currentGeysers.map(({ id, stakingToken, rewardToken }) => ({
          ...geyserAddressToConfig.get(toChecksumAddress(id))!,
          stakingTokenAddress: stakingToken,
          rewardTokenAddress: rewardToken,
        }))

        const geyserTokensSet = new Set(
          currentGeysers.flatMap(({ stakingToken, rewardToken }) => [stakingToken, rewardToken].map(toChecksumAddress)),
        )
        const rewardTokens = await Promise.all(
          geyserTokens.map(({ rewardToken, rewardTokenAddress }) =>
            getRewardTokenInfo(rewardTokenAddress, rewardToken, signerOrProvider),
          ),
        )
        const stakingTokens = await Promise.all(
          geyserTokens.map(({ stakingToken, stakingTokenAddress }) =>
            getStakingTokenInfo(stakingTokenAddress, stakingToken, signerOrProvider),
          ),
        )

        // calculate if geysers are active or not
        const geyserActivityPromise = currentGeysers.map(async (geyser, g) => {
          const geyserStats = await getGeyserStats(geyser, stakingTokens[g], rewardTokens[g], [])
          return geyserStats.duration > 0
        })
        const geyserActivity = await Promise.all(geyserActivityPromise)
        geyserActivity.forEach((a, g) => {
          currentGeysers[g].active = a
        })
        setGeysers(currentGeysers)

        // all relevant tokens: includes additional tokens from config/additionalTokens.ts and all staking & reward tokens from all geysers
        const additionalTokens = getAdditionalTokensList(networkId)
        const additionalTokensInfos = (
          await Promise.allSettled(
            additionalTokens
              .filter(({ enabled, address }) => enabled && !geyserTokensSet.has(toChecksumAddress(address)))
              .map(({ address }) => getTokenInfo(address, signerOrProvider)),
          )
        )
          .filter(({ status }) => status === 'fulfilled')
          .map((result) => (result as PromiseFulfilledResult<TokenInfo>).value)
        const newAllTokensInfos = additionalTokensInfos.concat(stakingTokens).concat(rewardTokens)
        setAllTokensInfos(newAllTokensInfos)

        // Get ALL LP APYs
        setStakeAPYs(await loadStakeAPYsFromCache())
      } catch (e) {
        console.error(e)
      }
    })()
  }

  const clearSatsCache = (selectedGeyser: Geyser | null, selectedVault: Vault | null) => {
    if (selectedGeyser) {
      clearGeyserStatsCache(selectedGeyser)
    }
    if (selectedGeyser && selectedVault) {
      clearUserStatsCache(selectedGeyser, selectedVault)
    }
  }

  const handleStakeUnstake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    clearSatsCache(selectedGeyserInfo?.geyser, selectedVault)
    if (geyserAction === GeyserAction.STAKE) {
      return handleStake(selectedVault, parsedAmount)
    } else if (geyserAction === GeyserAction.UNSTAKE) {
      return handleUnstake(selectedVault, parsedAmount)
    } else {
      return undefined
    }
  }

  const handleWrapping = async (
    wrapperTokenAddress: string,
    underlyingTokenAddress: string,
    amount: BigNumber,
    isWrap: boolean,
    selectedVault: Vault | null,
    depositToVault: boolean,
  ) => {
    if (!signer || amount.isZero()) {
      return undefined
    }

    const toAddress = depositToVault && selectedVault ? selectedVault.id : await signer.getAddress()
    if (isWrap) {
      return wrap(wrapperTokenAddress, underlyingTokenAddress, amount, toAddress, signer)
    } else {
      return unwrap(wrapperTokenAddress, amount, toAddress, signer)
    }
  }

  const handleUnstake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyserInfo.geyser && selectedVault && signer) {
      const geyserAddress = selectedGeyserInfo.geyser.id
      const vaultAddress = selectedVault.id
      return unstake(geyserAddress, vaultAddress, parsedAmount, signer)
    }
    return undefined
  }

  const handleStake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyserInfo.geyser && signer && !parsedAmount.isZero()) {
      const geyserAddress = selectedGeyserInfo.geyser.id
      return selectedVault
        ? approveDepositStake(geyserAddress, selectedVault.id, parsedAmount, signer)
        : approveCreateDepositStake(geyserAddress, parsedAmount, signer)
    }
    return undefined
  }

  const selectGeyser = async (geyser: Geyser) => {
    if (geyser.id && geyser.id === selectedGeyserInfo?.geyser?.id) {
      return
    }
    setDataLoading(true)
    const geyserAddress = toChecksumAddress(geyser.id)
    const geyserConfigs = getGeysersConfigList(networkId)
    const geyserConfig = geyserConfigs.find((config) => toChecksumAddress(config.address) === geyserAddress)
    if (!geyserConfig) {
      throw new Error(`Geyser config not found for geyser at ${geyserAddress}`)
    }
    const newStakingTokenInfo = await getStakingTokenInfo(
      geyser.stakingToken,
      geyserConfig.stakingToken,
      signerOrProvider,
    )
    const newRewardTokenInfo = await getRewardTokenInfo(geyser.rewardToken, geyserConfig.rewardToken, signerOrProvider)
    const newBonusTokensInfo: BonusTokenInfo[] = []
    for (let a = 0; a < geyser.bonusTokens.length; a++) {
      const bonusToken = await getBonusTokenInfo(geyser.bonusTokens[a], signerOrProvider)
      newBonusTokensInfo.push(bonusToken)
    }

    setSelectedGeyserConfig(geyserConfig)
    setSelectedGeyserInfo({
      geyser,
      isWrapped: geyserConfig.isWrapped || false,
      poolAddress: geyserConfig.poolAddress,
      stakingTokenInfo: newStakingTokenInfo,
      rewardTokenInfo: newRewardTokenInfo,
      bonusTokensInfo: newBonusTokensInfo,
    })
    await sleep(0.25)
    setDataLoading(false)
  }

  const selectGeyserById = async (id: string) => {
    const geyser = geysers.find((g) => toChecksumAddress(g.id) === toChecksumAddress(id))
    if (geyser) await selectGeyser(geyser)
  }

  const getGeyserSlugByName = (name: string): string => {
    const geyserConfigs = getGeysersConfigList(networkId)
    const geyser = geyserConfigs.find((g) => g.name === name)
    if (geyser) {
      return geyser.slug
    } else {
      return geyserConfigs[0].slug
    }
  }

  const selectGeyserBySlug = async (slug: string): Promise<boolean> => {
    const geyserConfigs = getGeysersConfigList(networkId)
    const geyser = geyserConfigs.find((g) => g.slug === slug)
    if (!geyser) {
      return false
    }
    await selectGeyserById(geyser.address)
    return true
  }

  const getGeyserConfig = (id: string) => {
    const geyserConfigs = getGeysersConfigList(networkId)
    const config = geyserConfigs.find((g) => toChecksumAddress(g.address) === toChecksumAddress(id))
    return config || null
  }

  const getDefaultGeyserConfig = () => {
    const geyserConfigs = getGeysersConfigList(networkId)
    return geyserConfigs[0] || null
  }

  const getGeyserName = (id: string) => {
    const geyserConfigs = getGeysersConfigList(networkId)
    const geyser = geyserConfigs.find((g) => toChecksumAddress(g.address) === toChecksumAddress(id))
    return geyser?.name || ''
  }

  useEffect(() => {
    const geyserConfigs = getGeysersConfigList(networkId)
    const ids = geyserConfigs.map((geyser) => geyser.address.toLowerCase())
    getGeysers({ variables: { ids } })
    console.log('network refresh')
  }, [networkId])

  useEffect(() => {
    (async () => {
      if (geyserData && geyserData.geysers && !selectedGeyserInfo.geyser) {
        await setupGeysers()
        console.log('geyser list refresh')
      }
    })()
  }, [geyserData])

  useEffect(() => {
    (async () => {
      if (geysers.length > 0) {
        await selectGeyser(geysers.find((geyser) => geyser.id === selectedGeyserInfo.geyser?.id) || geysers[0])
        console.log('geyser refresh')
      }
    })()
  }, [geysers])

  return (
    <GeyserContext.Provider
      value={{
        geysers,
        selectedGeyserInfo,
        selectGeyser,
        selectGeyserById,
        getGeyserSlugByName,
        selectGeyserBySlug,
        geyserAction,
        updateGeyserAction,
        handleStakeUnstake,
        handleWrapping,
        allTokensInfos,
        getGeyserConfig,
        getDefaultGeyserConfig,
        getGeyserName,
        selectedGeyserConfig,
        stakeAPYs,
        loading: dataLoading || (geyserLoading && !(geysers.length > 0)),
      }}
    >
      {children}
    </GeyserContext.Provider>
  )
}
