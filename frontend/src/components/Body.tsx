import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import { GeyserFirstContainer } from './GeyserFirstContainer'
import { VaultFirstContainer } from './VaultFirstContainer'
import { Mode } from '../constants'

export const Body = () => {
  const { mode } = useContext(AppContext)
  return mode === Mode.VAULTS ? <VaultFirstContainer /> : <GeyserFirstContainer />
}
