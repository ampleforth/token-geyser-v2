import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import { GeyserFirstContainer } from './GeyserFirst/GeyserFirstContainer'
import { VaultFirstContainer } from './VaultFirst/VaultFirstContainer'
import { Mode } from '../constants'

export const Body = () => {
  const { mode } = useContext(AppContext)
  return (
    <div className="bg-slate-500 h-[100%] w-screen">
      {mode === Mode.VAULTS ? <VaultFirstContainer /> : <GeyserFirstContainer />}
    </div>
  )
}
