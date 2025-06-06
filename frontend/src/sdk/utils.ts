import { TypedDataField } from '@ethersproject/abstract-signer'
import { BigNumberish, Contract, providers, Signer, utils as ethersUtils, Wallet } from 'ethers'
import { LogDescription, splitSignature } from 'ethers/lib/utils'
import { TransactionReceipt } from '@ethersproject/providers'

import { getConnectionConfig } from '../config/app'

export const loadNetworkConfig = async (signerOrProvider: Signer | providers.Provider) => {
  // console.log('provider present', !!signerOrProvider.network || !!signerOrProvider.provider?.network)
  const network = await (Signer.isSigner(signerOrProvider)
    ? signerOrProvider.provider?.getNetwork()
    : signerOrProvider.getNetwork())

  const conn = getConnectionConfig(network?.chainId || null)
  let networkName = conn.ref

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
  owner: Signer,
  delegateAddress: string,
  tokenAddress: string,
  amount: BigNumberish,
  vaultNonce?: BigNumberish,
  chainId?: BigNumberish,
) => {
  // get nonce
  vaultNonce = vaultNonce || (await vault.getNonce())
  // get chainId
  // console.log("provider present", !!vault?.provider?.network)
  const network = await vault.provider?.getNetwork()
  if (!network) {
    throw new Error('Network not found')
  }
  chainId = chainId || network.chainId
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

  // Try to sign with EIP-712
  let signedPermission
  try {
    signedPermission = await (owner as Wallet)._signTypedData(domain, types, value)
  } catch (error) {
    console.log('EIP-712 signing failed, falling back to eth_sign:', error)

    // Fallback to eth_sign
    const messageHash = ethersUtils._TypedDataEncoder.hash(domain, types, value)
    signedPermission = await owner.signMessage(messageHash)
  }

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
  owner: Signer,
  token: Contract,
  spenderAddress: string,
  value: BigNumberish,
  deadline: BigNumberish,
  nonce?: BigNumberish,
) => {
  // get nonce
  nonce = nonce || (await token.nonces(owner.getAddress()))
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
    owner: owner.getAddress(),
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  }

  // Try to sign with EIP-712
  let signedPermission
  try {
    signedPermission = await (owner as Wallet)._signTypedData(domainSeparator, types, values)
  } catch (error) {
    console.log('EIP-712 signing failed, falling back to eth_sign:', error)

    // Fallback to eth_sign
    const messageHash = ethersUtils._TypedDataEncoder.hash(
      { chainId: (await owner.provider?.getNetwork())?.chainId, ...domainSeparator },
      types,
      values,
    )
    signedPermission = await owner.signMessage(messageHash)
  }

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
