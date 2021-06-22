import { ReactNode, useEffect, useState } from "react"
import { TransactionResponse } from "@ethersproject/providers"
import { useTxStateMachine } from "hooks/useTxStateMachine"
import { ModalButton } from "styling/styles"
import { Modal } from "./Modal"
import { ProcessingButton } from "./ProcessingButton"
import { TxState } from "../constants"
import { SingleTxMessage } from "./SingleTxMessage"

interface Props {
  submit: () => Promise<TransactionResponse | undefined>
  txSuccessMessage?: ReactNode
  open: boolean
  onClose: () => void
}

export const SingleTxModal: React.FC<Props> = ({ submit, txSuccessMessage, open, onClose, children }) => {
  const txStateMachine = useTxStateMachine(submit)
  const { state, submitTx, refresh } = txStateMachine
  const [successMessage, setSuccessMessage] = useState<ReactNode>(null)

  useEffect(() => {
    if (open) {
      refresh()
      setSuccessMessage(txSuccessMessage || null)
      submitTx()
    }
  }, [open])

  const isProcessing = () => [TxState.PENDING, TxState.SUBMITTED].includes(state)

  return (
    <Modal onClose={onClose} open={open} disableClose={isProcessing()}>
      <Modal.Title>
        Processing Transaction
      </Modal.Title>
      <Modal.Body>
        <SingleTxMessage successMessage={successMessage} txStateMachine={txStateMachine} />
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
