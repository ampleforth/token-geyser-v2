import { TxStateMachine } from 'hooks/useTxStateMachine'
import { EtherscanLink } from 'components/EtherscanLink'
import { formatTokenBalance } from 'utils/amount'
import { TxState } from '../../constants'

interface Props {
  txStateMachine: TxStateMachine
  symbol: string
  amount: string
  successMessage?: string
  errorMessage?: string
}

export const WithdrawTxMessage: React.FC<Props> = ({
  txStateMachine: { state, response },
  symbol,
  amount,
  successMessage,
  errorMessage,
}) => {
  const getTxMessage = () => {
    switch (state) {
      case TxState.PENDING:
        return (
          <span>
            Withdrawing <b>{symbol}</b> to your wallet...
          </span>
        )
      case TxState.SUBMITTED:
        return (
          <span>
            Submitted <b>{symbol}</b> withdrawal transaction. View on <EtherscanLink txHash={response?.hash} />
          </span>
        )
      case TxState.MINED:
        return (
          <span>
            Successfully withdrew{' '}
            <b>
              {formatTokenBalance(amount)} {symbol}
            </b>{' '}
            to your wallet. View on <EtherscanLink txHash={response?.hash} />. {successMessage}
          </span>
        )
      case TxState.FAILED:
        return (
          <span>
            Unlocked{' '}
            <b>
              {formatTokenBalance(amount)} {symbol}
            </b>{' '}
            from the vault. {errorMessage}
          </span>
        )
      default:
        return <></>
    }
  }
  return getTxMessage()
}
