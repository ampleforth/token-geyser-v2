import styled from 'styled-components/macro'
import tw from 'twin.macro'
import geyserImage from 'assets/geyser.webp'

export const ErrorPage = ({ message, button, onClick }) => (
  <Container>
    <ImageWrapper>
      <GeyserImage src={geyserImage} alt="Geysers" />
    </ImageWrapper>
    <ErrorMessageContainer>
      <ErrorColoredDiv />
      <ErrorContent>
        <ErrorMessageContainerInner>
          <ErrorMessage>{message}</ErrorMessage>
          <ButtonWrapper>
            <BackButton onClick={onClick}>{button}</BackButton>
          </ButtonWrapper>
        </ErrorMessageContainerInner>
      </ErrorContent>
    </ErrorMessageContainer>
  </Container>
)

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-col flex-wrap w-full`}
  ${tw`sm:w-sm`}
`

const ImageWrapper = styled.div`
  ${tw`flex justify-center my-4`}
`

const GeyserImage = styled.img`
  ${tw`max-w-full w-full`}
  width:300px;
`

const ErrorMessageContainer = styled.div`
  ${tw`h-80px mt-1 mb-5 border border-lightGray flex flex-row tracking-wider`}
`

const ErrorColoredDiv = styled.div`
  ${tw`h-full w-2 bg-secondaryDark`}
`

const ErrorContent = styled.div`
  ${tw`flex flex-row flex-grow text-white bg-secondary font-bold`}
`

const ErrorMessageContainerInner = styled.div`
  ${tw`flex flex-row flex-grow w-full justify-between items-center px-5`}
`

const ErrorMessage = styled.span`
  ${tw`my-auto`}
`

const ButtonWrapper = styled.div`
  ${tw`flex-shrink-0`}
`

const BackButton = styled.button`
  ${tw`uppercase font-bold bg-secondaryDark text-white w-120px h-40px rounded`}
  ${tw`sm:text-sm`}
  ${tw`hover:border hover:border-white cursor-pointer`}
`
