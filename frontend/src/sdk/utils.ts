import { TypedDataField } from '@ethersproject/abstract-signer'
import { BigNumberish, Contract, Signer, Wallet } from 'ethers'
import { parseUnits, splitSignature } from 'ethers/lib/utils'
import mainnetConfig from './deployments/mainnet/factories-latest.json'
import goerliConfig from './deployments/goerli/factories-latest.json'
import localhostConfig from './deployments/localhost/factories-latest.json'
import { ERC20_ABI } from './abis'

export const ERC20Decimals = async (tokenAddress: string, signer: Signer) => {
  const token = new Contract(tokenAddress, ERC20_ABI, signer)
  return token.decimals()
}

export const parseUnitsWithDecimals = async (value: string, tokenAddress: string, signer: Signer) => {
  return parseUnits(value, await ERC20Decimals(tokenAddress, signer))
}

export const loadNetworkConfig = async (signer: Signer) => {
  const network = await signer.provider?.getNetwork()

  switch (network?.name) {
    case 'mainnet':
      return mainnetConfig
    case 'goerli':
      return goerliConfig
    case 'localhost':
      return localhostConfig
    default:
      throw new Error(`no network config for ${network?.name}`)
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
  return signedPermission
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
