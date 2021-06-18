import { createContext, useState } from 'react'
import { MODE } from '../constants'

export const AppContext = createContext<{
  mode: MODE
  toggleMode: () => void
}>({
  mode: MODE.Geysers,
  toggleMode: () => {},
})

export const AppContextProvider: React.FC = ({ children }) => {
  const [appMode, setAppMode] = useState<MODE>(MODE.Geysers)

  const toggleMode = () => (appMode === MODE.Geysers ? setAppMode(MODE.Vaults) : setAppMode(MODE.Geysers))

  return <AppContext.Provider value={{ mode: appMode, toggleMode }}>{children}</AppContext.Provider>
}
