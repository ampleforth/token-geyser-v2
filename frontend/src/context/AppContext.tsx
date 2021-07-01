import { createContext, useState } from 'react'
import { Mode } from '../constants'

export const AppContext = createContext<{
  mode: Mode
  toggleMode: () => void
}>({
  mode: Mode.GEYSERS,
  toggleMode: () => {},
})

export const AppContextProvider: React.FC = ({ children }) => {
  const [appMode, setAppMode] = useState<Mode>(Mode.GEYSERS)

  const toggleMode = () => setAppMode(appMode === Mode.GEYSERS ? Mode.VAULTS : Mode.GEYSERS)

  return <AppContext.Provider value={{ mode: appMode, toggleMode }}>{children}</AppContext.Provider>
}
