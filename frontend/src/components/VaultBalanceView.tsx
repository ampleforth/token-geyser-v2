import { StatsContext } from "context/StatsContext"
import { useContext, useState } from "react"
import styled from "styled-components/macro"
import tw from "twin.macro"
import { safeNumeral } from "utils/numeral"
import { Column, Table } from "./Table"
import { VaultTokenBalance } from "types"
import { VaultContext } from "context/VaultContext"
import { Align } from "../constants"
import { SingleTxModal } from "./SingleTxModal"

export const VaultBalanceView = () => {
  const { vaultStats: { vaultTokenBalances }, refreshVaultStats } = useContext(StatsContext)
  const { withdrawFromVault } = useContext(VaultContext)

  // state of the token about to be withdrawn
  const [tokenBalance, setTokenBalance] = useState<VaultTokenBalance>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const confirmWithdraw = (tokenBalance: VaultTokenBalance) => {
    setTokenBalance(tokenBalance)
    setModalOpen(true)
  }

  const submit = async () => {
    if (tokenBalance && withdrawFromVault) {
      const { address, parsedUnlockedBalance } = tokenBalance
      return withdrawFromVault(address, parsedUnlockedBalance)
    }
  }

  const onClose = () => {
    setModalOpen(false)
    refreshVaultStats()
  }

  const columns: Column[] = [
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
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

  const dataSource = vaultTokenBalances
    .map((vaultTokenBalance) =>
      ({
        key: vaultTokenBalance.symbol,
        token: vaultTokenBalance.symbol,
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
      })
    )

  return (
    <Container>
      <Table columns={columns} dataSource={dataSource} />
      <SingleTxModal
        open={modalOpen}
        submit={submit}
        txSuccessMessage={<span>Successfully withdrawn <b>{tokenBalance?.unlockedBalance} {tokenBalance?.symbol}</b>.</span>}
        onClose={onClose}
      />
    </Container>
  )
}

const Container = styled.div`
  ${tw`m-4`}
`

const ButtonText = styled.span`
  ${tw`m-2 text-xs`}
`

const ActionButton = styled.button`
  ${tw`flex border-2 rounded-lg bg-primary text-secondary uppercase m-auto`};
  ${tw`hover:border-primary hover:bg-secondary hover:text-primary`}
  ${tw`disabled:bg-lightGray disabled:cursor-not-allowed disabled:border-none disabled:text-white`}
`
