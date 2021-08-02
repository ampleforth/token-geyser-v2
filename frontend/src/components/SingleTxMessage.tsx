import { TxStateMachine } from "hooks/useTxStateMachine"
import { ReactNode } from "react"
import { TxState } from "../constants"
import { EtherscanLink } from "./EtherscanLink"

interface Props {
  txStateMachine: TxStateMachine
  successMessage: ReactNode
}

export const SingleTxMessage: React.FC<Props> = ({ txStateMachine: { state, response }, successMessage }) => {
  const getTxMessage = () => {
    switch(state) {
      case TxState.PENDING:
        return <span>Waiting for transaction confirmation...</span>
      case TxState.SUBMITTED:
        return (
          <span>
            Transaction submitted to blockchain, waiting to be mined.{' '}
            View on <EtherscanLink txHash={response?.hash} />
          </span>
        )
      case TxState.MINED:
        return (
          <>
            {successMessage}{' '}
            <span>View on <EtherscanLink txHash={response?.hash} /></span>
          </>
        )
      case TxState.FAILED:
        return <>Transaction failed.</>
      default:
        return <></>
    }
  }
  return getTxMessage()
}
