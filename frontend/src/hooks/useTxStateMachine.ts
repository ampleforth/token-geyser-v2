import { useEffect, useState } from 'react'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'
import { TxState } from '../constants'

type SubmitFunction = (receipt?: TransactionReceipt) => Promise<TransactionResponse | undefined>

type CurrentTxState = {
  state: TxState
  response?: TransactionResponse
  receipt?: TransactionReceipt
}

export type TxStateMachine = CurrentTxState & {
  submitTx: (receipt?: TransactionReceipt) => Promise<void>
  refresh: () => void
}

export const useTxStateMachine = (submit: SubmitFunction) => {
  const [currentTxState, setCurrentTxState] = useState<CurrentTxState>({ state: TxState.PENDING })

  useEffect(() => {
    ;(async () => {
      const { response } = currentTxState
      try {
        if (response) {
          const receipt = await response.wait()
          setCurrentTxState((txState) => ({ ...txState, receipt, state: TxState.MINED }))
        }
      } catch (e) {
        setCurrentTxState((txState) => ({ ...txState, state: TxState.FAILED }))
      }
    })()
  }, [currentTxState.response])

  const submitTx = async (receipt?: TransactionReceipt) => {
    try {
      const response = await submit(receipt)
      if (response) {
        setCurrentTxState((txState) => ({ ...txState, response, state: TxState.SUBMITTED }))
      } else {
        setCurrentTxState((txState) => ({ ...txState, state: TxState.FAILED }))
      }
    } catch (e) {
      setCurrentTxState((txState) => ({ ...txState, state: TxState.FAILED }))
    }
  }

  const refresh = () => {
    setCurrentTxState({ state: TxState.PENDING })
  }

  return {
    submitTx,
    refresh,
    ...currentTxState,
  }
}
