import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { TransactionResponse } from '@ethersproject/providers'
import { BigNumber, Wallet } from 'ethers'
import { Geyser, StakingTokenInfo, TokenInfo, GeyserConfig, RewardTokenInfo, Vault } from '../types'
import Web3Context from './Web3Context'
import { POLL_INTERVAL } from '../constants'
import {  getTokenInfo } from '../utils/token'
import { geyserConfigs } from '../config/geyser'
import { defaultStakingTokenInfo, getStakingTokenInfo } from '../utils/stakingToken'
import { approveCreateDepositStake, approveDepositStake, unstake } from '../sdk'
import { GET_GEYSERS } from '../queries/geyser'
import { Centered } from '../styling/styles'
import { defaultRewardTokenInfo, getRewardTokenInfo } from '../utils/rewardToken'
import { additionalTokens } from 'config/additionalTokens'

export const GeyserContext = createContext<{
  geysers: Geyser[]
  selectedGeyser: Geyser | null
  selectGeyser: (geyser: Geyser) => void
  selectGeyserById: (id: string) => void
  selectGeyserByName: (name: string) => void
  isStakingAction: boolean
  toggleStakingAction: () => void
  handleGeyserAction: (arg0: Vault |  null, arg1: BigNumber) => Promise<TransactionResponse | undefined>
  stakingTokenInfo: StakingTokenInfo
  rewardTokenInfo: RewardTokenInfo
  allTokensInfos: TokenInfo[]
  getGeyserName: (id: string) => string
  selectedGeyserConfig: GeyserConfig | null
}>({
  geysers: [],
  selectedGeyser: null,
  selectGeyser: () => {},
  selectGeyserById: () => {},
  selectGeyserByName: () => {},
  isStakingAction: true,
  toggleStakingAction: () => {},
  handleGeyserAction: async () => undefined,
  stakingTokenInfo: defaultStakingTokenInfo(),
  rewardTokenInfo: defaultRewardTokenInfo(),
  allTokensInfos: [],
  getGeyserName: () => '',
  selectedGeyserConfig: null,
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { signer, defaultProvider } = useContext(Web3Context)
  const signerOrProvider = signer || defaultProvider
  // Polling to fetch fresh geyser stats
  const [getGeysers, { loading: geyserLoading, data: geyserData }] = useLazyQuery(GET_GEYSERS, {
    pollInterval: POLL_INTERVAL,
  })
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyser, setSelectedGeyser] = useState<Geyser | null>(null)
  const [selectedGeyserConfig, setSelectedGeyserConfig] = useState<GeyserConfig | null>(null)
  const [allTokensInfos, setAllTokensInfos] = useState<TokenInfo[]>([])
  const [rewardTokenInfo, setRewardTokenInfo] = useState<RewardTokenInfo>(defaultRewardTokenInfo())
  const [geyserAddressToName] = useState<Map<string, string>>(new Map(geyserConfigs.map(geyser => [toChecksumAddress(geyser.address), geyser.name])))
  const [geyserNameToAddress] = useState<Map<string, string>>(new Map(geyserConfigs.map(geyser => [geyser.name, toChecksumAddress(geyser.address)])))

  const [stakingTokenInfo, setStakingTokenInfo] = useState<StakingTokenInfo>(defaultStakingTokenInfo())

  const [isStakingAction, setIsStakingAction] = useState(true)

  const toggleStakingAction = () => setIsStakingAction(!isStakingAction)
  const handleGeyserAction = async (selectedVault: Vault | null, parsedAmount: BigNumber) =>
    (isStakingAction ? handleStake : handleUnstake)(selectedVault, parsedAmount)

  const handleUnstake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyser && selectedVault && signer) {
      const geyserAddress = selectedGeyser.id
      const vaultAddress = selectedVault.id
      return unstake(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
    }
  }
  const handleStake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyser && signer && !parsedAmount.isZero()) {
      const geyserAddress = selectedGeyser.id
      return (selectedVault
        ? approveDepositStake(geyserAddress, selectedVault.id, parsedAmount, signer as Wallet)
        : approveCreateDepositStake(geyserAddress, parsedAmount, signer as Wallet)
      )
    }
  }

  const selectGeyser = (geyser: Geyser) => setSelectedGeyser(geyser)
  const selectGeyserById = (id: string) => setSelectedGeyser(geysers.find(geyser => toChecksumAddress(geyser.id) === toChecksumAddress(id)) || selectedGeyser)
  const selectGeyserByName = (name: string) => geyserNameToAddress.get(name) && selectGeyserById(geyserNameToAddress.get(name)!)
  const getGeyserName = (id: string) => geyserAddressToName.get(toChecksumAddress(id)) || ''

  useEffect(() => {
    const ids = geyserConfigs.map(geyser => geyser.address.toLowerCase())
    getGeysers({ variables: { ids }})
  }, [])

  useEffect(() => {
    if (geyserData && geyserData.geysers) {
      const currentGeysers = [...geyserData.geysers] as Geyser[]
      const ids = geyserConfigs.map(geyser => geyser.address.toLowerCase())
      currentGeysers.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      setGeysers(currentGeysers)

      ;(async () => {
        try {
          // staking and reward tokens might have custom logic for name / symbol
          const geyserAddressToTokens = new Map(
            geyserConfigs.map(({ address, stakingToken, rewardToken }) => [toChecksumAddress(address), { stakingToken, rewardToken }]))

          const geyserTokens = currentGeysers.map(
            ({ id, stakingToken, rewardToken }) => ({ ...geyserAddressToTokens.get(toChecksumAddress(id))!, stakingTokenAddress: stakingToken, rewardTokenAddress: rewardToken })
          )

          const geyserTokensSet = new Set(currentGeysers.flatMap(({ stakingToken, rewardToken }) => [stakingToken, rewardToken].map(toChecksumAddress)))

          const rewardTokens = await Promise.all(geyserTokens.map(({ rewardToken, rewardTokenAddress }) => getRewardTokenInfo(rewardTokenAddress, rewardToken, signerOrProvider)))
          const stakingTokens = await Promise.all(geyserTokens.map(({ stakingToken, stakingTokenAddress }) => getStakingTokenInfo(stakingTokenAddress, stakingToken, signerOrProvider)))

          const additionalTokensInfos = (
            await Promise.allSettled(
              additionalTokens
                .filter(({ enabled, address }) => enabled && !geyserTokensSet.has(toChecksumAddress(address)))
                .map(({ address }) => getTokenInfo(address, signerOrProvider))
            )
          )
            .filter(({ status }) => status === 'fulfilled')
            .map((result) => (result as PromiseFulfilledResult<TokenInfo>).value)


          // all relevant tokens: includes additional tokens from config/additionalTokens.ts and all staking & reward tokens from all geysers
          const newAllTokensInfos = additionalTokensInfos.concat(stakingTokens).concat(rewardTokens)
          setAllTokensInfos(newAllTokensInfos)
        } catch (e) {
          console.error(e)
        }
      })()
    }
  }, [geyserData])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (selectedGeyser) {
        try {
          const geyserAddress = toChecksumAddress(selectedGeyser.id)
          const geyserConfig = geyserConfigs.find(config => toChecksumAddress(config.address) === geyserAddress)
          if (!geyserConfig) {
            throw new Error(`Geyser config not found for geyser at ${geyserAddress}`)
          }
          const newStakingTokenInfo = await getStakingTokenInfo(selectedGeyser.stakingToken, geyserConfig.stakingToken, signerOrProvider)
          const newRewardTokenInfo = await getRewardTokenInfo(selectedGeyser.rewardToken, geyserConfig.rewardToken, signerOrProvider)
          if (mounted) {
            setStakingTokenInfo(newStakingTokenInfo)
            setRewardTokenInfo(newRewardTokenInfo)
            setSelectedGeyserConfig(geyserConfig)
          }
        } catch (e) {
          console.error(e)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [selectedGeyser])

  useEffect(() => {
    if (geysers.length > 0) {
      selectGeyser(geysers.find(geyser => geyser.id === selectedGeyser?.id) || geysers[0])
    }
  }, [geysers])

  if (geyserLoading) return <Centered>Loading...</Centered>

  return (
    <GeyserContext.Provider
      value={{
        geysers,
        selectedGeyser,
        selectGeyser,
        selectGeyserById,
        selectGeyserByName,
        isStakingAction,
        toggleStakingAction,
        handleGeyserAction,
        stakingTokenInfo,
        rewardTokenInfo,
        allTokensInfos,
        getGeyserName,
        selectedGeyserConfig,
      }}
    >
      {children}
    </GeyserContext.Provider>
  )
}
