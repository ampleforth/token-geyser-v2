import { ApolloProvider } from '@apollo/client'
import { AppContextProvider } from 'context/AppContext'
import { Body } from 'components/Body'
import { Header } from './components/Header'
import { VaultContextProvider } from './context/VaultContext'
import { GeyserContextProvider } from './context/GeyserContext'
import { Web3Provider } from './context/Web3Context'
import { client } from './queries/client'
import { WalletContextProvider } from './context/WalletContext'
import { StatsContextProvider } from './context/StatsContext'

function App() {
  return (
    <ApolloProvider client={client}>
      <AppContextProvider>
        <Web3Provider>
          <GeyserContextProvider>
            <VaultContextProvider>
              <WalletContextProvider>
                <StatsContextProvider>
                  <Header />
                  <Body />
                </StatsContextProvider>
              </WalletContextProvider>
            </VaultContextProvider>
          </GeyserContextProvider>
        </Web3Provider>
      </AppContextProvider>
    </ApolloProvider>
  )
}

export default App
