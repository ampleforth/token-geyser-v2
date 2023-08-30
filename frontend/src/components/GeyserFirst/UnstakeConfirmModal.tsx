import { BigNumber } from 'ethers'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { ModalButton } from 'styling/styles'
import { Modal } from 'components/Modal'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  parsedUserInput: BigNumber
}

export const UnstakeConfirmModal: React.FC<Props> = ({ open, onClose, onConfirm }) => (
  <Modal onClose={onClose} open={open}>
    <Modal.Title>Are you sure?</Modal.Title>
    <Modal.Body>If you stayed deposited, you could be eligible for additional rewards.</Modal.Body>
    <Modal.Footer>
      <ModalButton className="mr-4" onClick={onClose}>
        No, Wait
      </ModalButton>
      <ConfirmButton onClick={onConfirm}>Withdraw Anyway</ConfirmButton>
    </Modal.Footer>
  </Modal>
)

const ConfirmButton = styled(ModalButton)`
  ${tw`rounded-lg bg-primary text-secondary font-semibold`}
`
