import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'
import { useTxStateMachine, TxStateMachine } from 'hooks/useTxStateMachine'
import { ReactNode, useEffect, useState } from 'react'
import { ModalButton } from 'styling/styles'
import { Modal } from 'components/Modal'
import { ProcessingButton } from 'components/ProcessingButton'
import { SingleTxMessage } from 'components/SingleTxMessage'
import { TxState } from '../../constants'

interface Props {
  open: boolean
  onClose: () => void
  unstake: () => Promise<TransactionResponse | undefined>
  unstakeSuccessMessage: ReactNode

  withdrawStaking: () => Promise<TransactionResponse | undefined>
  withdrawStakingTxMessage: (txStateMachine: TxStateMachine) => ReactNode

  withdrawReward: (receipt?: TransactionReceipt) => Promise<TransactionResponse | undefined>
  withdrawRewardTxMessage: (TxStateMachine: TxStateMachine) => ReactNode
}

export const UnstakeTxModal: React.FC<Props> = ({
  open,
  onClose,
  unstake,
  unstakeSuccessMessage,
  withdrawStaking,
  withdrawReward,
  withdrawStakingTxMessage,
  withdrawRewardTxMessage,
  children,
}) => {
  const unstakeTxStateMachine = useTxStateMachine(unstake)
  const withdrawStakeStateMachine = useTxStateMachine(withdrawStaking)
  const withdrawRewardStateMachine = useTxStateMachine(withdrawReward)
  const [submittedWithdraw, setSubmittedWithdraw] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      setSubmittedWithdraw(false)
      unstakeTxStateMachine.refresh()
      withdrawStakeStateMachine.refresh()
      withdrawRewardStateMachine.refresh()
      unstakeTxStateMachine.submitTx()
    }
  }, [open])

  useEffect(() => {
    const { state: unstakeState, receipt: unstakeReceipt } = unstakeTxStateMachine
    if (unstakeState === TxState.MINED && unstakeReceipt && !submittedWithdraw) {
      withdrawStakeStateMachine.submitTx()
      withdrawRewardStateMachine.submitTx(unstakeReceipt)
      setSubmittedWithdraw(true)
    }
  }, [unstakeTxStateMachine])

  const getModalBody = () => {
    if (unstakeTxStateMachine.state !== TxState.MINED)
      return <SingleTxMessage txStateMachine={unstakeTxStateMachine} successMessage={unstakeSuccessMessage} />
    return (
      <div className="flex flex-col space-y-2">
        <div>
          <SingleTxMessage txStateMachine={unstakeTxStateMachine} successMessage={unstakeSuccessMessage} />
        </div>
        <div>{withdrawStakingTxMessage(withdrawStakeStateMachine)}</div>
        <div>{withdrawRewardTxMessage(withdrawRewardStateMachine)}</div>
        <span className="text-gray text-xs">
          <i>Unlocked tokens can be withdrawn from your assets view at anytime.</i>
        </span>
      </div>
    )
  }

  const isProcessing = () => {
    const processingStates = new Set([TxState.PENDING, TxState.SUBMITTED])
    const unstakeProcessing = processingStates.has(unstakeTxStateMachine.state)
    const withdrawProcessing =
      unstakeTxStateMachine.state === TxState.MINED &&
      [withdrawStakeStateMachine, withdrawRewardStateMachine].filter(({ state }) => processingStates.has(state))
        .length > 0
    return unstakeProcessing || withdrawProcessing
  }

  return (
    <Modal onClose={onClose} open={open} disableClose={isProcessing()}>
      <Modal.Title>Processing Transaction</Modal.Title>
      <Modal.Body>
        {getModalBody()}
        {children}
      </Modal.Body>
      <Modal.Footer>
        {isProcessing() ? <ProcessingButton /> : <ModalButton onClick={onClose}> Close </ModalButton>}
      </Modal.Footer>
    </Modal>
  )
}
