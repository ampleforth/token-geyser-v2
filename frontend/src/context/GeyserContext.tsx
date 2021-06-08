import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { toChecksumAddress } from 'web3-utils'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GET_GEYSERS } from '../queries/geyser'
import { Geyser, StakingTokenInfo, TokenInfo } from '../types'
import Web3Context from './Web3Context'
import { POLL_INTERVAL } from '../constants'
import { defaultTokenInfo, getTokenInfo } from '../utils/token'
import { GeyserConfig, geysersConfig } from '../config/geyser'
import { defaultStakingTokenInfo, getStakingTokenInfo } from '../utils/stakingToken'

export const GeyserContext = createContext<{
  geysers: Geyser[]
  selectedGeyser: Geyser | null
  selectGeyser: (geyser: Geyser) => void
  selectGeyserById: (id: string) => void
  stakingTokenInfo: StakingTokenInfo
  rewardTokenInfo: TokenInfo
  platformTokenInfo: TokenInfo
  geyserAddressToName: Map<string, string>
  selectedGeyserConfig: GeyserConfig | null
}>({
  geysers: [],
  selectedGeyser: null,
  selectGeyser: () => {},
  selectGeyserById: () => {},
  stakingTokenInfo: defaultStakingTokenInfo(),
  rewardTokenInfo: defaultTokenInfo(),
  platformTokenInfo: defaultTokenInfo(),
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
  const [platformTokenInfo, setPlatformTokenInfo] = useState<TokenInfo>(defaultTokenInfo())
  const [rewardTokenInfo, setRewardTokenInfo] = useState<TokenInfo>(defaultTokenInfo())
  const [geyserAddressToName] = useState<Map<string, string>>(new Map(geysersConfig.map(geyser => [toChecksumAddress(geyser.address), geyser.name])))

  const [stakingTokenInfo, setStakingTokenInfo] = useState<StakingTokenInfo>(defaultStakingTokenInfo())

  const selectGeyser = (geyser: Geyser) => setSelectedGeyser(geyser)
  const selectGeyserById = (id: string) => setSelectedGeyser(geysers.find(geyser => toChecksumAddress(geyser.id) === toChecksumAddress(id)) || selectedGeyser)

  useEffect(() => {
    const ids = geysersConfig.map(geyser => geyser.address.toLowerCase())
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
          const geyserConfig = geysersConfig.find(config => toChecksumAddress(config.address) === geyserAddress)
          if (!geyserConfig) {
            throw new Error(`Geyser config not found for geyser at ${geyserAddress}`)
          }
          const newStakingTokenInfo = await getStakingTokenInfo(selectedGeyser.stakingToken, geyserConfig.stakingToken, signer)
          const newRewardTokenInfo = await getTokenInfo(selectedGeyser.rewardToken, signer)
          const { platformTokenAddress } = geyserConfig
          const newPlatformTokenInfo = platformTokenAddress ? await getTokenInfo(platformTokenAddress, signer) : defaultTokenInfo()
          if (mounted) {
            setStakingTokenInfo(newStakingTokenInfo)
            setRewardTokenInfo(newRewardTokenInfo)
            setPlatformTokenInfo(newPlatformTokenInfo)
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

  if (geyserLoading) return <LoadingSpinner />

  return (
    <GeyserContext.Provider
      value={{
        geysers,
        selectedGeyser,
        selectGeyser,
        selectGeyserById,
        stakingTokenInfo,
        rewardTokenInfo,
        platformTokenInfo,
        geyserAddressToName,
        selectedGeyserConfig,
      }}
    >
      {children}
    </GeyserContext.Provider>
  )
}
