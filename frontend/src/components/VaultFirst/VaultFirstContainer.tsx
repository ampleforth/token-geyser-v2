import React, { useContext } from 'react'
import styled from 'styled-components/macro'
import { CardLabel, Overlay } from 'styling/styles'
import tw from 'twin.macro'
import { VaultContext } from 'context/VaultContext'
import Web3Context from 'context/Web3Context'
import { useNavigate } from 'react-router-dom'
import PageLoader from 'components/PageLoader'
import { ErrorPage } from 'components/ErrorPage'
import { Tooltip } from 'components/Tooltip'
import { VaultBalanceView } from './VaultBalanceView'
import { UNIVERSAL_VAULT_MSG } from '../../constants'

export const VaultFirstContainer = () => {
  const { ready, connectWallet, validNetwork } = useContext(Web3Context)
  const { vaults, loading } = useContext(VaultContext)
  const navigate = useNavigate()

  if (!ready) {
    return <ErrorPage message="Wallet not connected" button="connect" onClick={() => connectWallet()} />
  }

  if (ready && validNetwork === false) {
    return <ErrorPage message="Unsupported Network" button="Go back" onClick={() => navigate('/')} />
  }

  if (ready && vaults.length === 0) {
    return <ErrorPage message="Vault not found" button="Go back" onClick={() => navigate('/')} />
  }

  if (ready && loading) {
    return <PageLoader />
  }

  return (
    <Container>
      <Overlay>
        <Title>
          <TitleText>Manage balances</TitleText>
          <Tooltip
            classNames="ml-2 text-lightGray hover:text-white normal-case"
            messages={[
              {
                title: 'The Universal Vault',
                body: UNIVERSAL_VAULT_MSG(),
              },
            ]}
          />
        </Title>
        <VaultBalanceView />
      </Overlay>
    </Container>
  )
}

const Title = styled(CardLabel)`
  ${tw`p-5 font-normal bg-black text-white`}
`

const TitleText = styled.div`
  ${tw`text-md uppercase`}
`

const Container = styled.div`
  ${tw`text-center m-auto flex flex-wrap w-full flex-col`}
  ${tw`sm:w-sm`}
`
