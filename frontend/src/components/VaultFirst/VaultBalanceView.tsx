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
import { formatTokenBalance } from '../../utils/amount'

export const VaultBalanceView = () => {
  const {
    vaultStats: { id: vaultId, vaultTokenBalances },
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
      title: <TitleText>Token</TitleText>,
      dataIndex: 'token',
      key: 'token',
      widthClass: 'sm:w-1/3 w-1/4',
    },
    {
      title: <TitleText>Balance</TitleText>,
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: <TitleText>Unlocked</TitleText>,
      dataIndex: 'unlocked',
      key: 'unlocked',
    },
    {
      title: <TitleText>Action</TitleText>,
      dataIndex: 'action',
      key: 'action',
      textAlign: Align.CENTER,
    },
  ]

  const dataSource = vaultTokenBalances
    .filter((b) => b.balance > 0)
    .map((vaultTokenBalance) => ({
      key: vaultTokenBalance.symbol,
      token: (
        <TokenText>
          <a
            href={`https://etherscan.io/token/${vaultTokenBalance.address}?a=${vaultId}`}
            className="hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {vaultTokenBalance.symbol}
          </a>
        </TokenText>
      ),
      balance: (
        <BalanceText>
          <a
            href={`https://etherscan.io/token/${vaultTokenBalance.address}?a=${vaultId}`}
            target="_blank"
            rel="noreferrer"
          >
            {formatTokenBalance(vaultTokenBalance.balance)}
          </a>
        </BalanceText>
      ),
      unlocked: safeNumeral(vaultTokenBalance.unlockedBalance / vaultTokenBalance.balance, '0.00%'),
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
  ${tw`m-4`}
`

const TitleText = styled.span`
  ${tw`font-bold underline`}
`

const ButtonText = styled.span`
  ${tw`m-1 text-xs py-3 sm:px-2`}
`

const ActionButton = styled.button`
  ${tw`flex m-auto text-link bg-green uppercase text-white`}
  ${tw`disabled:bg-lightGray disabled:bg-opacity-50 disabled:cursor-not-allowed disabled:border-none disabled:text-white`}
  ${tw`focus:outline-none`}
  &:not(:disabled):hover {
    ${tw`bg-greenDark`}
  }
`

const TokenText = styled.div`
  ${Ellipsis}
  ${tw`text-sm font-semiBold text-darkGray`}
`

const BalanceText = styled.span`
  ${tw`text-sm cursor-pointer`}
`
