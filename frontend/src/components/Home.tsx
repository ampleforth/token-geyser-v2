import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { WelcomeMessage } from 'components/WelcomeMessage'
import WelcomeHero from 'components/WelcomeHero'
import { GeyserContext } from 'context/GeyserContext'
import { VaultContext } from 'context/VaultContext'
import { Loader } from 'styling/styles'
import { toChecksumAddress } from 'web3-utils'
import TokenIcons from 'components/TokenIcons'
import { safeNumeral } from 'utils/numeral'
import { getGeyserTotalDeposit } from 'utils/stats'
import { formatUnits } from 'ethers/lib/utils'

const nowInSeconds = () => Math.round(Date.now() / 1000)

export const Home = () => {
  const { geysers, getGeyserConfig, allTokensInfos, stakeAPYs } = useContext(GeyserContext)
  const { selectedVault } = useContext(VaultContext)
  const navigate = useNavigate()
  const stakedGeysers = selectedVault ? selectedVault.locks.map((l) => l.geyser) : []
  const now = nowInSeconds()
  const tokensByAddress = allTokensInfos.reduce((acc, t) => {
    acc[toChecksumAddress(t.address)] = t
    return acc
  }, {})
  const extractProgramName = (n) => n.replace(/\s*\(.*?\)\s*/g, '').trim()
  const geyserData = geysers
    .map((g) => {
      const config = getGeyserConfig(g.id)
      const stakingTokenInfo = tokensByAddress[toChecksumAddress(g.stakingToken)]
      const rewardTokenInfo = tokensByAddress[toChecksumAddress(g.rewardToken)]
      const tvl = stakingTokenInfo ? getGeyserTotalDeposit(g, stakingTokenInfo) : 0
      const stakingTokens = (stakingTokenInfo && stakingTokenInfo.composition.map((t) => t.symbol)) || []
      const lpAPY = (stakeAPYs.lp && stakeAPYs.lp[config.lpRef]) || 0
      const geyserAPY = (stakeAPYs.geysers && stakeAPYs.geysers[config.ref]) || 0
      const apy = lpAPY + geyserAPY
      const programName = extractProgramName(config.name)

      let rewards = 0
      if (rewardTokenInfo) {
        // NOTE: This math doesn't work if AMPL is the reward token as it doesn't account for rebasing!
        const rewardAmt = g.rewardSchedules
          .filter((s) => parseInt(s.start, 10) + parseInt(s.duration, 10) > now)
          .reduce((m, s) => m + parseFloat(formatUnits(s.rewardAmount, rewardTokenInfo.decimals)), 0)
        rewards = rewardAmt * rewardTokenInfo.price
      }

      const isStablePool = config.name.includes('USDC') && config.name.includes('SPOT')
      const poolType = `${isStablePool ? 'Stable' : 'Vol'}[${stakingTokens.join('/')}]`
      return {
        id: g.id,
        active: g.active,
        stakingTokens,
        tvl,
        rewards,
        apy,
        name: programName,
        ref: config.ref,
        poolAddress: config.poolAddress,
        poolType,
      }
    })
    .sort((g1, g2) => g2.apy - g1.apy)

  const totalTVL = geyserData.reduce((s, g) => g.tvl + s, 0)
  const totalRewards = geyserData.filter((g) => g.active).reduce((s, g) => g.rewards + s, 0)
  const geysersToShow = geyserData.filter((g) => g.active || stakedGeysers.find((s) => s.id === g.id))

  return (
    <Container>
      <WelcomeMessage />
      <WelcomeHero tvl={totalTVL} totalRewards={totalRewards} />
      {geysersToShow.length > 0 ? (
        <GeysersTable>
          <thead>
            <tr>
              <TableHeader />
              <TableHeader>Live Programs</TableHeader>
              <DataHeader>TVL</DataHeader>
              <DataHeader>Rewards</DataHeader>
              <DataHeader>Stake APY</DataHeader>
            </tr>
          </thead>
          <tbody>
            {geysersToShow.map((g) => (
              <BodyRow key={g.ref} $inactive={!g.active}>
                <TableCell>
                  <a href={g.poolAddress} target="_blank" rel="noreferrer">
                    <TokenIcons tokens={g.stakingTokens} />
                  </a>
                </TableCell>
                <TableCell>
                  <ProgramInfo>
                    <ProgramName onClick={() => navigate(`/geysers/${g.ref}`)}>{g.name}</ProgramName>
                    <InfoText>{g.poolType}</InfoText>
                  </ProgramInfo>
                </TableCell>
                <DataCell>{g.tvl > 0 ? `${safeNumeral(g.tvl, '$0,0')}` : 'N/A'}</DataCell>
                <DataCell>{g.rewards > 0 ? `${safeNumeral(g.rewards, '$0,0')}` : 'N/A'}</DataCell>
                <ApyCell>{g.apy > 0 ? `~${safeNumeral(g.apy, '0.00%')}` : 'N/A'}</ApyCell>
              </BodyRow>
            ))}
          </tbody>
        </GeysersTable>
      ) : (
        <LoaderContainer>
          <Loader />
        </LoaderContainer>
      )}
    </Container>
  )
}

const Container = styled.div`
  ${tw`m-auto my-4 flex flex-col flex-wrap w-full`}
  ${tw`sm:w-sm`}
`

const GeysersTable = styled.table`
  ${tw`w-full border-collapse`}
`

const TableHeader = styled.th`
  ${tw`text-left p-4 font-semibold`}
  ${tw`underline`}
`

const DataHeader = styled.th`
  ${tw`text-right font-semibold pr-8`}
  ${tw`underline`}
`

const BodyRow = styled.tr<{ $inactive?: boolean }>`
  ${({ $inactive }) => $inactive && tw`opacity-50`}
  ${tw`border`}
`

const TableCell = styled.td`
  ${tw`p-4 text-center`}
`

const DataCell = styled.td`
  ${tw`text-right pr-8`}
`

const ApyCell = styled.td`
  ${tw`text-right pr-8 font-bold text-md`}
`

const ProgramInfo = styled.div`
  ${tw`flex flex-col text-left`}
`

const ProgramName = styled.div`
  ${tw`font-bold cursor-pointer text-lg`}
  ${tw`hover:underline`}
`

const InfoText = styled.div`
  ${tw`font-mono text-yellow-600 text-xxs uppercase font-bold`}
`

const LoaderContainer = styled.div`
  ${tw`m-auto my-4 flex flex-col flex-wrap w-full items-center justify-center`}
`

export default Home
