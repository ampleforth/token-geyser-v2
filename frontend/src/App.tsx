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

function App() {
  return (
    <AppContextProvider>
      <Web3Provider>
        <SubgraphProvider>
          <GeyserContextProvider>
            <VaultContextProvider>
              <WalletContextProvider>
                <StatsContextProvider>
                  <Header />
                  <DropdownsContainer />
                  <Body />
                  <Footer />
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
