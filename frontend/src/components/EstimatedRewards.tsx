import styled from 'styled-components/macro'
import tw from 'twin.macro'
import rewardSymbol from 'assets/rewardSymbol.svg'
import info from 'assets/info.svg'

export const EstimatedRewards = () => {
  return (
    <EstimatedRewardsContainer>
      <ColoredDiv />
      <Img src={rewardSymbol} alt="Rewards Symbol" />
      <RewardsTextContainer>
        <RewardsLabel>
          Your Estimated Rewards <Img src={info} alt="Info" />
        </RewardsLabel>
        <RewardsAmount>0.00 Ampl</RewardsAmount>
      </RewardsTextContainer>
    </EstimatedRewardsContainer>
  )
}

const EstimatedRewardsContainer = styled.div`
  height: 120px;
  ${tw`shadow-md my-6 border border-lightGray rounded flex flex-row font-roboto tracking-wide`}
`

const ColoredDiv = styled.div`
  width: 1em;
  height: 100%;
  background: #ff2d55;
  ${tw`shadow-md rounded-l`}
`

const Img = styled.img`
  ${tw`mx-4`}
`

const RewardsTextContainer = styled.div`
  ${tw`flex flex-col my-auto`}
`

const RewardsLabel = styled.span`
  ${tw`flex capitalize text-gray font-bold`}
`

const RewardsAmount = styled.span`
  ${tw`flex uppercase font-extrabold`}
`
