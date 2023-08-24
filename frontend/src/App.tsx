import { AppContextProvider } from 'context/AppContext'
import { Body } from 'components/Body'
import { Header } from 'components/Header'
import { Footer } from 'components/Footer'
import { VaultContextProvider } from 'context/VaultContext'
import { GeyserContextProvider } from 'context/GeyserContext'
import { Web3Provider } from 'context/Web3Context'
import { SubgraphProvider } from 'context/SubgraphContext'
import { WalletContextProvider } from 'context/WalletContext'
import { StatsContextProvider } from 'context/StatsContext'
import { DropdownsContainer } from 'components/DropdownsContainer'

import { useEffect } from 'react'
import BottomFooter from 'components/BottomFooter'

function App() {
  useEffect(() => {
    localStorage.clear()
  }, [])

  return (
    <AppContextProvider>
      <Web3Provider>
        <SubgraphProvider>
          <GeyserContextProvider>
            <VaultContextProvider>
              <WalletContextProvider>
                <StatsContextProvider>
                  <div className="flex flex-col gap-8">
                    <Header />
                    <DropdownsContainer />
                    <Body />
                    <Footer />
                    <BottomFooter />
                  </div>
                </StatsContextProvider>
              </WalletContextProvider>
            </VaultContextProvider>
          </GeyserContextProvider>
        </SubgraphProvider>
      </Web3Provider>
    </AppContextProvider>
  )
}

export default App
