import { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import tw from 'twin.macro'
import { Overlay } from 'styling/styles'
import { GeyserAction } from 'types'
import Web3Context from 'context/Web3Context'
import { GeyserContext } from 'context/GeyserContext'
import { TabView } from 'components/TabView'
import { ErrorPage } from 'components/ErrorPage'
import PageLoader from 'components/PageLoader'
import { GeyserStakeView } from './GeyserStakeView'
import { GeyserStatsView } from './GeyserStatsView'

export const GeyserFirstContainer = () => {
  const { slug } = useParams()
  const { ready, validNetwork } = useContext(Web3Context)
  const {
    geyserAction,
    updateGeyserAction,
    selectedGeyserInfo: { isWrapped },
    selectGeyserBySlug,
    geysers,
    loading,
  } = useContext(GeyserContext)
  const actions = Object.values(GeyserAction)
  const navigate = useNavigate()

  const [geyserNotFound, setGeyserNotFound] = useState(false)
  useEffect(() => {
    const fetchGeyser = async () => {
      if (slug && geysers.length > 0) {
        const found = await selectGeyserBySlug(slug)
        setGeyserNotFound(!found)
      }
    }
    fetchGeyser()
  }, [slug, geysers, selectGeyserBySlug])

  if (loading) return <PageLoader />

  if (ready && validNetwork === false) {
    return <ErrorPage message="Unsupported Network" button="Go back" onClick={() => navigate('/')} />
  }

  if (geyserNotFound) {
    return <ErrorPage message="Geyser not found" button="Go back" onClick={() => navigate('/')} />
  }

  return (
    <Container>
      <Overlay>
        <GeyserStatsView />
      </Overlay>
      <Overlay>
        <ToggleContainer>
          <TabView
            active={actions.indexOf(geyserAction)}
            onChange={(a) => updateGeyserAction(actions[a])}
            tabs={isWrapped ? ['Stake', 'Unstake', 'Wrapper'] : ['Stake', 'Unstake']}
          />
        </ToggleContainer>
        <GeyserStakeView />
      </Overlay>
    </Container>
  )
}

const Container = styled.div`
  ${tw`text-center m-auto my-4 flex flex-col flex-wrap w-full`}
  ${tw`sm:w-sm`}
`

const ToggleContainer = styled.div`
  ${tw`m-6`}
`
