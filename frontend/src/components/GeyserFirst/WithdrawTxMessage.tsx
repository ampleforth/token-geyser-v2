import { TxStateMachine } from "hooks/useTxStateMachine"
import { EtherscanLink } from "components/EtherscanLink"
import { TxState } from "../../constants"

interface Props {
  txStateMachine: TxStateMachine
  symbol: string
  amount: string
}

export const WithdrawTxMessage: React.FC<Props> = ({ txStateMachine: { state, response }, symbol, amount }) => {
  const getTxMessage = () => {
    switch (state) {
      case TxState.PENDING:
        return <span>Withdrawing {symbol} from your vault...</span>
      case TxState.SUBMITTED:
        return (
          <span>
            Withdrawing {symbol} from your vault...{' '}
            View on <EtherscanLink txHash={response?.hash} />
          </span>
        )
      case TxState.MINED:
        return (
          <span>
            Successfully withdrew <b>{amount} {symbol}</b> from your vault to your wallet.{' '}
            View on <EtherscanLink txHash={response?.hash} />
          </span>
        )
      case TxState.FAILED:
        return (
          <span>
            Unlocked <b>{amount} {symbol}</b> that can be withdrawn from your vault.
          </span>
        )
      default:
        return <></>
    }
  }
  return getTxMessage()
}
