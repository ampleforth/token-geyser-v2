import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { GET_GEYSERS } from '../queries/geyser'
import { Geyser, StakingTokenInfo, TokenInfo, GeyserConfig, Vault } from '../types'
import Web3Context from './Web3Context'
import { POLL_INTERVAL } from '../constants'
import { defaultTokenInfo, getTokenInfo } from '../utils/token'
import { geyserConfigs } from '../config/geyser'
import { defaultStakingTokenInfo, getStakingTokenInfo } from '../utils/stakingToken'
import { BigNumber, Wallet } from 'ethers'
import { approveCreateDepositStake, approveDepositStake, unstakeWithdraw } from 'sdk'
import { TransactionReceipt } from '@ethersproject/providers'
import { Centered } from 'styling/styles'

export const GeyserContext = createContext<{
  geysers: Geyser[]
  selectedGeyser: Geyser | null
  selectGeyser: (geyser: Geyser) => void
  selectGeyserById: (id: string) => void
  isStakingAction: boolean
  toggleStakingAction: () => void
  handleGeyserAction: (arg0: Vault |  null, arg1: BigNumber) => Promise<TransactionReceipt | undefined>
  stakingTokenInfo: StakingTokenInfo
  rewardTokenInfo: TokenInfo
  platformTokenInfos: TokenInfo[]
  geyserAddressToName: Map<string, string>
  selectedGeyserConfig: GeyserConfig | null
}>({
  geysers: [],
  selectedGeyser: null,
  selectGeyser: () => {},
  selectGeyserById: () => {},
  isStakingAction: true,
  toggleStakingAction: () => {},
  handleGeyserAction: async () => undefined,
  stakingTokenInfo: defaultStakingTokenInfo(),
  rewardTokenInfo: defaultTokenInfo(),
  platformTokenInfos: [],
  geyserAddressToName: new Map<string, string>(),
  selectedGeyserConfig: null,
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { signer } = useContext(Web3Context)
  // Polling to fetch fresh geyser stats
  const [getGeysers, { loading: geyserLoading, data: geyserData }] = useLazyQuery(GET_GEYSERS, {
    pollInterval: POLL_INTERVAL,
  })
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyser, setSelectedGeyser] = useState<Geyser | null>(null)
  const [selectedGeyserConfig, setSelectedGeyserConfig] = useState<GeyserConfig | null>(null)
  const [platformTokenInfos, setPlatformTokenInfos] = useState<TokenInfo[]>([])
  const [rewardTokenInfo, setRewardTokenInfo] = useState<TokenInfo>(defaultTokenInfo())
  const [geyserAddressToName] = useState<Map<string, string>>(new Map(geyserConfigs.map(geyser => [toChecksumAddress(geyser.address), geyser.name])))

  const [stakingTokenInfo, setStakingTokenInfo] = useState<StakingTokenInfo>(defaultStakingTokenInfo())

  const [isStakingAction, setIsStakingAction] = useState(true)

  const toggleStakingAction = () => setIsStakingAction(!isStakingAction)
  const handleGeyserAction = async (selectedVault: Vault | null, parsedAmount: BigNumber) => {
    if (isStakingAction) {
      const stakedReceipt = await handleStake(selectedVault, parsedAmount)
      return stakedReceipt
    } else {
      const unstakedReceipt = await handleUnstake(selectedVault, parsedAmount)
      return unstakedReceipt
    }
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

  useEffect(() => {
    const ids = geyserConfigs.map(geyser => geyser.address.toLowerCase())
    getGeysers({ variables: { ids }})
  }, [])

  useEffect(() => {
    if (geyserData && geyserData.geysers) setGeysers(geyserData.geysers as Geyser[])
  }, [geyserData])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (signer && selectedGeyser) {
        try {
          const geyserAddress = toChecksumAddress(selectedGeyser.id)
          const geyserConfig = geyserConfigs.find(config => toChecksumAddress(config.address) === geyserAddress)
          if (!geyserConfig) {
            throw new Error(`Geyser config not found for geyser at ${geyserAddress}`)
          }
          const newStakingTokenInfo = await getStakingTokenInfo(selectedGeyser.stakingToken, geyserConfig.stakingToken, signer)
          const newRewardTokenInfo = await getTokenInfo(selectedGeyser.rewardToken, signer)
          const { platformTokenConfigs } = geyserConfig
          const newPlatformTokenInfos = await Promise.all(platformTokenConfigs.map(({ address }) => getTokenInfo(address, signer)))
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
    })()
    return () => {
      mounted = false
    }
  }, [signer, selectedGeyser])

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
        isStakingAction,
        toggleStakingAction,
        handleGeyserAction,
        stakingTokenInfo,
        rewardTokenInfo,
        platformTokenInfos,
        geyserAddressToName,
        selectedGeyserConfig,
      }}
    >
      {children}
    </GeyserContext.Provider>
  )
}
