import { useQuery } from '@apollo/client'
import { createContext, useEffect, useState } from 'react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GET_GEYSERS } from '../queries/geyser'
import { Geyser } from '../types'

export const GeyserContext = createContext<{ geysers: Geyser[] }>({ geysers: [] })

export const GeyserContextProvider: React.FC = ({ children }) => {
  const { loading: geyserLoading, data: geyserData } = useQuery(GET_GEYSERS)
  const [geysers, setGeysers] = useState<Geyser[]>([])

  useEffect(() => {
    if (geyserData && geyserData.geysers) setGeysers(geyserData.geysers as Geyser[])
  }, [geyserData])

  if (geyserLoading) return <LoadingSpinner />

  return <GeyserContext.Provider value={{ geysers }}>{children}</GeyserContext.Provider>
}
