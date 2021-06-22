import { AppContext } from 'context/AppContext'
import { useContext } from 'react'
import { MODE } from '../constants'
import { GeyserFirstContainer } from './GeyserFirstContainer'

export const Body = () => {
  const { mode } = useContext(AppContext)
  return <>{mode === MODE.Vaults ? <div>Vaults view</div> : <GeyserFirstContainer />}</>
}
