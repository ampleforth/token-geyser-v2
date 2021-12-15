import { Dialog, Transition } from '@headlessui/react'
import { createContext, Fragment, MutableRefObject, useRef } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

// Modal needs a focusable element to function correctly.
// Use a context to pass the ref object down to Modal.Body,
// which will make the modal focus on Modal.Body, if given
const ModalContext = createContext<{
  ref: MutableRefObject<null> | null
}>({
  ref: null
})

const Title: React.FC = ({ children }) => (
  <Dialog.Title
    as="h3"
    className="text-lg font-medium leading-6 text-gray-900"
  >
    {children}
  </Dialog.Title>
)

const Body: React.FC = ({ children }) => (
  <ModalContext.Consumer>
    {({ ref }) => (
      <MessageContainer>
        <Message ref={ref}>
          {children}
        </Message>
      </MessageContainer>
    )}
  </ModalContext.Consumer>
)

const Footer: React.FC = ({ children }) => (
  <FooterContainer>
    {children}
  </FooterContainer>
)

interface ModalSubComponents {
  Title: React.FC
  Body: React.FC
  Footer: React.FC
}

interface Props {
  onClose: () => void
  open: boolean
  initialFocus?: MutableRefObject<null>
  disableClose?: boolean
}

const ModalRoot: React.FC<Props> = ({ open, onClose, disableClose, children, initialFocus }) => {
  const ref = initialFocus ?? useRef(null)

  return (
    <ModalContext.Provider value={{ ref }}>
      <Transition appear show={open} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={disableClose ? () => {} : onClose}
          initialFocus={ref}
        >
          <Container>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30"/>
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
                {children}
              </ContentContainer>
            </Transition.Child>
          </Container>
        </Dialog>
      </Transition>
    </ModalContext.Provider>
  )
}

export const Modal: React.FC<Props> & ModalSubComponents = Object.assign(ModalRoot, { Title, Body, Footer })

const Container = styled.div`
  ${tw`min-h-screen px-4 text-center`}
`

const ContentContainer = styled.div`
  ${tw`inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl`}
`

const MessageContainer = styled.div`
  ${tw`mt-2`}
`

const Message = styled.div`
  ${tw`text-sm`}
`

const FooterContainer = styled.div`
  ${tw`mt-8 flex justify-center`}
`
