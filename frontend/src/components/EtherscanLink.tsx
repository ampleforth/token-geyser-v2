import { EXTERNAL_LINKS } from "../constants";

interface Props {
  txHash?: string
}

export const EtherscanLink: React.FC<Props> = ({ txHash }) => (
  <a rel="noreferrer" className="text-link" href={`${EXTERNAL_LINKS.etherscan}/${txHash}`} target="_blank">Etherscan</a>
)
