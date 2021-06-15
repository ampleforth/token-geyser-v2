import styled from 'styled-components/macro'
import tw from 'twin.macro'
import rewardSymbol from 'assets/rewardSymbol.svg'
import info from 'assets/info.svg'

export const EstimatedRewards = () => {
  return (
    <EstimatedRewardsContainer>
      <ColoredDiv />
      <Img src={rewardSymbol} alt="Rewards Symbol" className="w-0 sm:w-auto"/>
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
  ${tw`h-120px shadow-all-xs my-6 border border-lightGray rounded flex flex-row tracking-wide`}
`

const ColoredDiv = styled.div`
  ${tw`rounded-l-sm h-full bg-radicalRed w-4`}
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
  ${tw`flex uppercase font-bold`}
`
