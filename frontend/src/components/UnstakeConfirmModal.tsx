import { Dialog, Transition } from '@headlessui/react'
import { StatsContext } from '../context/StatsContext'
import { Fragment, useContext, useEffect, useState } from 'react'
import { safeNumeral } from '../utils/numeral'
import { GeyserContext } from 'context/GeyserContext'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { BigNumber } from 'ethers'

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
    (async () => {
      setLoss(safeNumeral(await computeLossFromUnstake1Month(parsedUserInput), '0,0.00'))
    })();
  }, [parsedUserInput])

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <Container>
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          {/* This element is to trick the browser into centering the modal contents. */}
          <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <ContentContainer>
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Are you sure?
                </Dialog.Title>
                <MessageContainer>
                  <Message>
                    If you stayed deposited for 1 more month,
                    you could be eligible for an additional&nbsp;
                    <b>
                      {loss}{' '}
                      {symbol}
                    </b>{' '}
                    reward.
                  </Message>
                </MessageContainer>

                <ButtonContainer>
                  <Button className="mr-4" onClick={onClose}>No, Wait</Button>
                  <ConfirmButton onClick={onConfirm}>Withdraw Anyway</ConfirmButton>
                </ButtonContainer>
              </ContentContainer>
            </Transition.Child>
          </Container>
      </Dialog>
    </Transition>
  )
}

const Container = styled.div`
  ${tw`min-h-screen px-4 text-center`}
`

const ContentContainer = styled.div`
  ${tw`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl`}
`

const MessageContainer = styled.div`
  ${tw`mt-2`}
`

const Message = styled.p`
  ${tw`text-sm`}
`

const ButtonContainer = styled.div`
  ${tw`mt-8 flex justify-center`}
`

const Button = styled.button`
  width: 40%;
  ${tw`inline-flex items-center justify-center px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
`

const ConfirmButton = styled(Button)`
  ${tw`rounded-lg bg-primary text-secondary font-semibold`}
`
