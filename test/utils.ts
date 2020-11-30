import { ethers, upgrades } from 'hardhat'
import { Signer, Contract } from 'ethers'

export interface HardHatSigner extends Signer {
  address: string
}

export async function increaseTime(seconds: number) {
  ethers.provider.send('evm_increaseTime', [seconds])
}

export async function getTimestamp() {
  return (await ethers.provider.getBlock('latest')).timestamp
}

// Perc has to be a whole number
export async function invokeRebase(
  ampl: Contract,
  perc: number,
  orchestrator: Signer,
) {
  const PERC_DECIMALS = 2
  const s = await ampl.totalSupply.call()
  const ordinate = 10 ** PERC_DECIMALS
  const p_ = ethers.BigNumber.from(perc * ordinate).div(100)
  const s_ = s.mul(p_).div(ordinate)
  await ampl.connect(orchestrator).rebase(1, s_)
}

export async function deployContract(name: string, args: Array<any> = []) {
  const factory = await ethers.getContractFactory(name)
  const contract = await factory.deploy(...args)
  return contract.deployed()
}

export async function deployAmpl(admin: HardHatSigner) {
  const factory = await ethers.getContractFactory('MockAmpl')
  const ampl = await upgrades.deployProxy(factory, [admin.address], {
    initializer: 'initialize(address)',
  })
  await ampl.connect(admin).setMonetaryPolicy(admin.address)
  const amplInitialSupply = await ampl.balanceOf(admin.address)
  return { ampl, amplInitialSupply }
}

export async function deployGeyser(args: Array<string | number>) {
  const factory = await ethers.getContractFactory('Geyser')
  return upgrades.deployProxy(factory, args, {
    unsafeAllowCustomTypes: true,
  })
}
