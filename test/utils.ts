import { Signer } from 'ethers'

export interface HardHatSigner extends Signer {
  address: string
}
