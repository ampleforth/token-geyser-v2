import { TypedDataField } from '@ethersproject/abstract-signer'
import { BigNumberish, Contract, providers, Signer, Wallet } from 'ethers'
import { LogDescription, splitSignature } from 'ethers/lib/utils'
import { TransactionReceipt } from '@ethersproject/providers'

import { getConnectionConfig } from '../config/app'

export const loadNetworkConfig = async (signerOrProvider: Signer | providers.Provider) => {
  const network = await (Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider?.getNetwork()
    : signerOrProvider.getNetwork())

  const conn = getConnectionConfig(network?.chainId || null)
  let networkName = conn.ref

  if (networkName === 'base') {
    networkName = 'base-mainnet'
  }

  try {
    return require(`./deployments/${networkName}/factories-latest.json`)
  } catch (e) {
    console.log(`no network config for ${networkName}`)
    return require('./deployments/mainnet/factories-latest.json')
  }
}

export const isPermitable = async (tokenAddress: string) => {
  // todo: implement permit token querying
  return true
}

export const signPermission = async (
  method: string,
  vault: Contract,
  owner: Wallet,
  delegateAddress: string,
  tokenAddress: string,
  amount: BigNumberish,
  vaultNonce?: BigNumberish,
  chainId?: BigNumberish,
) => {
  // get nonce
  vaultNonce = vaultNonce || (await vault.getNonce())
  // get chainId
  chainId = chainId || (await vault.provider.getNetwork()).chainId
  // craft permission
  const domain = {
    name: 'UniversalVault',
    version: '1.0.0',
    chainId,
    verifyingContract: vault.address,
  }
  const types = {} as Record<string, TypedDataField[]>
  types[method] = [
    { name: 'delegate', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ]
  const value = {
    delegate: delegateAddress,
    token: tokenAddress,
    amount: amount,
    nonce: vaultNonce,
  }
  // sign permission
  // todo: add fallback if wallet does not support eip 712 rpc
  const signedPermission = await owner._signTypedData(domain, types, value)
  // return

  const replaceV: any = []
  replaceV['00'] = '1b'
  replaceV['01'] = '1c'

  let signedPermissionNew
  if (replaceV[signedPermission.slice(-2)]) {
    signedPermissionNew = signedPermission.slice(0, signedPermission.length - 2) + replaceV[signedPermission.slice(-2)]
  } else {
    signedPermissionNew = signedPermission
  }

  return signedPermissionNew
}

export const signPermitEIP2612 = async (
  owner: Wallet,
  token: Contract,
  spenderAddress: string,
  value: BigNumberish,
  deadline: BigNumberish,
  nonce?: BigNumberish,
) => {
  // get nonce
  nonce = nonce || (await token.nonces(owner.address))
  // get domain
  const domainSeparator = await token.DOMAIN_SEPARATOR()
  // get types
  const types = {} as Record<string, TypedDataField[]>
  types['Permit'] = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ]
  // get values
  const values = {
    owner: owner.address,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  }
  // sign permission
  // todo: add fallback if wallet does not support eip 712 rpc
  const signedPermission = await owner._signTypedData(domainSeparator, types, values)
  // split signature
  const sig = splitSignature(signedPermission)
  // return
  return [values.owner, values.spender, values.value, values.deadline, sig.v, sig.r, sig.s]
}

// utility function to parse an event from a transaction receipt
// useful when we need to get data from a specific transaction (e.g. getting the actual rewards claimed from unstake)
export const parseFirstEventFromReceipt = (
  receipt: TransactionReceipt,
  contract: Contract,
  event: string,
): LogDescription | null => {
  const events = parseAllEventsFromReceipt(receipt, contract, event)
  return events.length > 0 ? events[0] : null
}

export const parseAllEventsFromReceipt = (
  receipt: TransactionReceipt,
  contract: Contract,
  event: string,
): LogDescription[] => {
  const filter = contract.filters[event]
  if (!filter) return []
  const eventFilter = filter()
  if (!eventFilter || !eventFilter.topics || eventFilter.topics.length === 0) return []
  const topicHash = eventFilter.topics[0]
  return receipt.logs.filter((log) => log.topics[0] === topicHash).map((l) => contract.interface.parseLog(l))
}
