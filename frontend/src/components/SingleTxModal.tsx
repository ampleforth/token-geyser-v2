import { ReactNode, useEffect, useState } from "react"
import { TransactionResponse } from "@ethersproject/providers"
import { useTxStateMachine } from "hooks/useTxStateMachine"
import { ModalButton } from "styling/styles"
import { Modal } from "./Modal"
import { ProcessingButton } from "./ProcessingButton"
import { TxState } from "../constants"

interface Props {
  submit: () => Promise<TransactionResponse | undefined>
  txSuccessMessage?: ReactNode
  open: boolean
  onClose: () => void
}

export const SingleTxModal: React.FC<Props> = ({ submit, txSuccessMessage, open, onClose, children }) => {
  const { state, response, submitTx, refresh } = useTxStateMachine(submit)
  const [successMessage, setSuccessMessage] = useState<ReactNode>(null)

  useEffect(() => {
    if (open) {
      refresh()
      setSuccessMessage(txSuccessMessage || null)
      submitTx()
    }
  }, [open])

  const getModalBody = () => {
    switch(state) {
      case TxState.PENDING:
        return <span>Waiting for user to confirm transaction...</span>
      case TxState.SUBMITTED:
        return (
          <span>
            Transaction submitted to blockchain, waiting to be mined.{' '}
            View on <a rel="noreferrer" className="text-link" href={`https://etherscan.io/tx/${response?.hash}`} target="_blank">Etherscan</a>
          </span>
        )
      case TxState.MINED:
        return (
          <>
            {successMessage}{' '}
            <span>View on <a rel="noreferrer" className="text-link" href={`https://etherscan.io/tx/${response?.hash}`} target="_blank">Etherscan</a></span>
          </>
        )
      case TxState.FAILED:
        return <>Transaction failed.</>
      default:
        return <></>
    }
  }

  const isProcessing = () => [TxState.PENDING, TxState.SUBMITTED].includes(state)

  return (
    <Modal onClose={onClose} open={open} disableClose={isProcessing()}>
      <Modal.Title>
        Processing Transaction
      </Modal.Title>
      <Modal.Body>
        {getModalBody()}
        {children}
      </Modal.Body>
      <Modal.Footer>
        {isProcessing() ? (
          <ProcessingButton />
        ) : (
          <ModalButton onClick={onClose}> Close </ModalButton>
        )}
      </Modal.Footer>
    </Modal>
  )
}
