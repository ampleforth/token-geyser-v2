import { useLazyQuery } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GET_GEYSERS } from '../queries/geyser'
import { ERC20Decimals, ERC20Name, ERC20Symbol } from '../sdk'
import { Geyser } from '../types'
import Web3Context from './Web3Context'
import { toChecksumAddress } from 'web3-utils'
import { POLL_INTERVAL } from '../constants'

export const GeyserContext = createContext<{
  geysers: Geyser[],
  selectedGeyser: Geyser | null,
  selectGeyser: (geyser: Geyser) => void,
  stakingTokenDecimals: number,
  stakingTokenSymbol: string,
  stakingTokenName: string,
}>({
  geysers: [],
  selectedGeyser: null,
  selectGeyser: () => {},
  stakingTokenDecimals: 0,
  stakingTokenSymbol: '',
  stakingTokenName: '',
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { signer } = useContext(Web3Context)
  // Polling to fetch fresh geyser stats
  const [getGeysers, { loading: geyserLoading, data: geyserData }] = useLazyQuery(GET_GEYSERS, {
    pollInterval: POLL_INTERVAL,
  })
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyser, setSelectedGeyser] = useState<Geyser | null>(null)
  const [stakingTokenDecimals, setStakingTokenDecimals] = useState<number>(0)
  const [stakingTokenName, setStakingTokenName] = useState<string>('')
  const [stakingTokenSymbol, setStakingTokenSymbol] = useState<string>('')

  const selectGeyser = (geyser: Geyser) => setSelectedGeyser(geyser)

  useEffect(() => {
    getGeysers()
  }, [])

  useEffect(() => {
    if (geyserData && geyserData.geysers) setGeysers(geyserData.geysers as Geyser[])
  }, [geyserData])

  useEffect(() => {
    let mounted = true
    if (signer && selectedGeyser) {
      const tokenAddress = toChecksumAddress(selectedGeyser.stakingToken)
      ERC20Decimals(tokenAddress, signer)
        .then(d => {
          if (mounted)
            setStakingTokenDecimals(d)
        })
        .catch(console.error)
      ERC20Name(tokenAddress, signer)
        .then(n => {
          if (mounted)
            setStakingTokenName(n)
        })
        .catch(console.error)
      ERC20Symbol(tokenAddress, signer)
        .then(s => {
          if (mounted)
            setStakingTokenSymbol(s)
        })
        .catch(console.error)
    }
    return () => { mounted = false }
  }, [signer, selectedGeyser])

  useEffect(() => {
    if (geysers.length > 0) selectGeyser(geysers[0])
  }, [geysers])

  if (geyserLoading) return <LoadingSpinner />

  return (
    <GeyserContext.Provider
      value={{
        geysers,
        selectedGeyser,
        selectGeyser,
        stakingTokenDecimals,
        stakingTokenSymbol,
        stakingTokenName,
      }}>
      {children}
    </GeyserContext.Provider>
  )
}
