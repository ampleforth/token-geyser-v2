import { StatsContext } from 'context/StatsContext'
import { useContext, useState } from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { safeNumeral } from 'utils/numeral'
import { VaultTokenBalance } from 'types'
import { VaultContext } from 'context/VaultContext'
import { WalletContext } from 'context/WalletContext'
import { Ellipsis } from 'styling/styles'
import { Column, Table } from 'components/Table'
import { SingleTxModal } from 'components/SingleTxModal'
import { Align } from '../../constants'

export const VaultBalanceView = () => {
  const {
    vaultStats: { vaultTokenBalances },
    refreshVaultStats,
  } = useContext(StatsContext)
  const { withdrawFromVault } = useContext(VaultContext)

  // state of the token about to be withdrawn
  const [tokenBalance, setTokenBalance] = useState<VaultTokenBalance>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const { refreshWalletBalances } = useContext(WalletContext)

  const confirmWithdraw = (balance: VaultTokenBalance) => {
    setTokenBalance(balance)
    setModalOpen(true)
  }

  const submit = async () => {
    if (tokenBalance && withdrawFromVault) {
      const { address, parsedUnlockedBalance } = tokenBalance
      return withdrawFromVault(address, parsedUnlockedBalance)
    }
    return undefined
  }

  const onClose = async () => {
    setModalOpen(false)
    await refreshVaultStats()
    await refreshWalletBalances()
  }

  const columns: Column[] = [
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      widthClass: 'sm:w-1/3 w-1/4',
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: 'Unlocked',
      dataIndex: 'unlocked',
      key: 'unlocked',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      textAlign: Align.CENTER,
    },
  ]

  const dataSource = vaultTokenBalances.map((vaultTokenBalance) => ({
    key: vaultTokenBalance.symbol,
    token: <TextEllipsis>{vaultTokenBalance.symbol}</TextEllipsis>,
    balance: safeNumeral(vaultTokenBalance.balance, '0.00000'),
    unlocked: safeNumeral(vaultTokenBalance.unlockedBalance, '0.00000'),
    action: (
      <ActionButton
        disabled={vaultTokenBalance.parsedUnlockedBalance.isZero()}
        onClick={() => confirmWithdraw(vaultTokenBalance)}
      >
        <ButtonText>Withdraw</ButtonText>
      </ActionButton>
    ),
  }))

  return (
    <Container>
      <Table columns={columns} dataSource={dataSource} />
      <SingleTxModal
        open={modalOpen}
        submit={submit}
        txSuccessMessage={
          <span>
            Successfully withdrawn{' '}
            <b>
              {tokenBalance?.unlockedBalance} {tokenBalance?.symbol}
            </b>
            .
          </span>
        }
        onClose={onClose}
      />
    </Container>
  )
}

const Container = styled.div`
  ${tw`m-4 text-black`}
`

const ButtonText = styled.span`
  ${tw`m-1 text-xs py-3 sm:px-2`}
`

const ActionButton = styled.button`
  ${tw`flex m-auto text-link bg-0D23EE bg-opacity-5 uppercase`}
  ${tw`disabled:bg-lightGray disabled:bg-opacity-50 disabled:cursor-not-allowed disabled:border-none disabled:text-gray`}
  ${tw`focus:outline-none`}
`

const TextEllipsis = styled.div`
  ${Ellipsis}
`
