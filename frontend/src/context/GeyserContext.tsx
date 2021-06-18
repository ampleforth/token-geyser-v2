import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { TransactionReceipt } from '@ethersproject/providers'
import { BigNumber, Wallet } from 'ethers'
import {  getTokenInfo } from '../utils/token'
import { Geyser, StakingTokenInfo, TokenInfo, GeyserConfig, RewardTokenInfo, Vault, GeyserStatus } from '../types'
import Web3Context from './Web3Context'
import { POLL_INTERVAL } from '../constants'
import { geyserConfigs } from '../config/geyser'
import { defaultStakingTokenInfo, getStakingTokenInfo } from '../utils/stakingToken'
import { approveCreateDepositStake, approveDepositStake, unstakeWithdraw } from '../sdk'
import { GET_GEYSERS } from '../queries/geyser'
import { Centered } from '../styling/styles'
import { defaultRewardTokenInfo, getRewardTokenInfo } from '../utils/rewardToken'

export const GeyserContext = createContext<{
  geysers: Geyser[]
  selectedGeyser: Geyser | null
  selectGeyser: (geyser: Geyser) => void
  selectGeyserById: (id: string) => void
  selectGeyserByName: (name: string) => void
  isStakingAction: boolean
  toggleStakingAction: () => void
  handleGeyserAction: (arg0: Vault |  null, arg1: BigNumber) => Promise<TransactionReceipt | undefined>
  stakingTokenInfo: StakingTokenInfo
  rewardTokenInfo: RewardTokenInfo
  platformTokenInfos: TokenInfo[]
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
  platformTokenInfos: [],
  getGeyserName: () => '',
  selectedGeyserConfig: null,
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { signer, defaultProvider } = useContext(Web3Context)
  // Polling to fetch fresh geyser stats
  const [getGeysers, { loading: geyserLoading, data: geyserData }] = useLazyQuery(GET_GEYSERS, {
    pollInterval: POLL_INTERVAL,
  })
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyser, setSelectedGeyser] = useState<Geyser | null>(null)
  const [selectedGeyserConfig, setSelectedGeyserConfig] = useState<GeyserConfig | null>(null)
  const [platformTokenInfos, setPlatformTokenInfos] = useState<TokenInfo[]>([])
  const [rewardTokenInfo, setRewardTokenInfo] = useState<RewardTokenInfo>(defaultRewardTokenInfo())
  const [geyserAddressToName] = useState<Map<string, string>>(new Map(geyserConfigs.map(geyser => [toChecksumAddress(geyser.address), geyser.name])))
  const [geyserNameToAddress] = useState<Map<string, string>>(new Map(geyserConfigs.map(geyser => [geyser.name, toChecksumAddress(geyser.address)])))

  const [stakingTokenInfo, setStakingTokenInfo] = useState<StakingTokenInfo>(defaultStakingTokenInfo())

  const [isStakingAction, setIsStakingAction] = useState(true)

  const toggleStakingAction = () => setIsStakingAction(!isStakingAction)
  const handleGeyserAction = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (isStakingAction) {
      const stakedReceipt = await handleStake(selectedVault, parsedAmount)
      return stakedReceipt
    }
    const unstakedReceipt = await handleUnstake(selectedVault, parsedAmount)
    return unstakedReceipt
    
  }

  const handleUnstake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyser && selectedVault && signer) {
      const geyserAddress = selectedGeyser.id
      const vaultAddress = selectedVault.id
      const [withdrawStakingTokenTx] = await unstakeWithdraw(
        geyserAddress,
        vaultAddress,
        parsedAmount,
        signer as Wallet,
      )
      const receipt = await withdrawStakingTokenTx.wait()
      return receipt
    }
  }

  const handleStake = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (selectedGeyser && signer && !parsedAmount.isZero()) {
      const geyserAddress = selectedGeyser.id
      let tx
      if (selectedVault) {
        const vaultAddress = selectedVault.id
        tx = await approveDepositStake(geyserAddress, vaultAddress, parsedAmount, signer as Wallet)
      } else {
        tx = await approveCreateDepositStake(geyserAddress, parsedAmount, signer as Wallet)
      }
      const receipt = await tx.wait()
      return receipt
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
    }
  }, [geyserData])

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (selectedGeyser) {
        try {
          const geyserAddress = toChecksumAddress(selectedGeyser.id)
          const geyserConfig = geyserConfigs.find(config => toChecksumAddress(config.address) === geyserAddress)
          if (!geyserConfig) {
            throw new Error(`Geyser config not found for geyser at ${geyserAddress}`)
          }
          const newStakingTokenInfo = await getStakingTokenInfo(selectedGeyser.stakingToken, geyserConfig.stakingToken, signer || defaultProvider)
          const newRewardTokenInfo = await getRewardTokenInfo(selectedGeyser.rewardToken, geyserConfig.rewardToken, signer || defaultProvider)
          const { platformTokenConfigs } = geyserConfig
          const newPlatformTokenInfos = await Promise.all(platformTokenConfigs.map(({ address }) => getTokenInfo(address, signer || defaultProvider)))
          if (mounted) {
            setStakingTokenInfo(newStakingTokenInfo)
            setRewardTokenInfo(newRewardTokenInfo)
            setPlatformTokenInfos(newPlatformTokenInfos)
            setSelectedGeyserConfig(geyserConfig)
          }
        } catch (e) {
          console.error(e)
        }
      }
    })();
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
        platformTokenInfos,
        getGeyserName,
        selectedGeyserConfig,
      }}
    >
      {children}
    </GeyserContext.Provider>
  )
}
