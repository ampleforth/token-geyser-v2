import { useQuery } from '@apollo/client'
import { createContext, useEffect, useState } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GET_GEYSERS } from '../queries/geyser'
import { Geyser } from '../types'

export const GeyserContext = createContext<{
  geysers: Geyser[],
  selectedGeyser: Geyser | null,
  selectGeyser: (geyser: Geyser) => void, 
}>({
  geysers: [],
  selectedGeyser: null,
  selectGeyser: () => {}
})

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { loading: geyserLoading, data: geyserData } = useQuery(GET_GEYSERS)
  const [geysers, setGeysers] = useState<Geyser[]>([])
  const [selectedGeyser, setSelectedGeyser] = useState<Geyser | null>(null)

  const selectGeyser = (geyser: Geyser) => setSelectedGeyser(geyser)

  useEffect(() => {
    if (geyserData && geyserData.geysers) setGeysers(geyserData.geysers as Geyser[])
  }, [geyserData])

  useEffect(() => {
    if (geysers.length > 0) selectGeyser(geysers[0])
  }, [geysers])

  if (geyserLoading) return <LoadingSpinner />

  return <GeyserContext.Provider value={{ geysers, selectedGeyser, selectGeyser }}>{children}</GeyserContext.Provider>
}
