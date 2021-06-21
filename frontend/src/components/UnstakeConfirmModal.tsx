import { useContext, useEffect, useState } from 'react'
import { safeNumeral } from 'utils/numeral'
import { StatsContext } from 'context/StatsContext'
import { GeyserContext } from 'context/GeyserContext'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { BigNumber } from 'ethers'
import { ModalButton } from 'styling/styles'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  parsedUserInput: BigNumber
}

export const UnstakeConfirmModal: React.FC<Props> = ({ parsedUserInput, open, onClose, onConfirm }) => {
  const { computeLossFromUnstake1Month } = useContext(StatsContext)
  const { rewardTokenInfo: { symbol }} = useContext(GeyserContext)
  const [loss, setLoss] = useState<string>('0.00')

  useEffect(() => {
    ;(async () => {
      setLoss(safeNumeral(await computeLossFromUnstake1Month(parsedUserInput), '0,0.00'))
    })()
  }, [parsedUserInput])

  return (
    <Modal onClose={onClose} open={open}>
      <Modal.Title>
        Are you sure?
      </Modal.Title>
      <Modal.Body>
        If you stayed deposited for 1 more month,{' '}
        you could be eligible for an additional{' '}
        <b>
          {loss}{' '}
          {symbol}
        </b>{' '}
        reward.
      </Modal.Body>
      <Modal.Footer>
        <ModalButton className="mr-4" onClick={onClose}>No, Wait</ModalButton>
        <ConfirmButton onClick={onConfirm}>Withdraw Anyway</ConfirmButton>
      </Modal.Footer>
    </Modal>
  )
}

const ConfirmButton = styled(ModalButton)`
  ${tw`rounded-lg bg-primary text-secondary font-semibold`}
`
