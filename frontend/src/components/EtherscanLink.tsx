import { useContext } from 'react'
import Web3Context from 'context/Web3Context'
import { getConnectionConfig } from 'config/app'


interface Props {
  txHash?: string
}

export const EtherscanLink: React.FC<Props> = ({ txHash }) => {
  const { networkId } = useContext(Web3Context)
  const {explorerUrl} = getConnectionConfig(networkId)
  return (
    <a rel="noreferrer" className="text-link" href={`${explorerUrl}/${txHash}`} target="_blank">Block explorer</a>
  )
}
