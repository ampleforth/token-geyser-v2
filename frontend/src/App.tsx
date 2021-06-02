import { ApolloProvider } from '@apollo/client';
import { Header } from './components/Header'
import { GeyserFirstContainer } from './components/GeyserFirstContainer'
import { VaultContextProvider } from './context/VaultContext'
import { GeyserContextProvider } from './context/GeyserContext'
import { Web3Provider } from './context/Web3Context';
import { client } from './queries/client';
import { WalletContextProvider } from './context/WalletContext';

function App() {
  return (
    <ApolloProvider client={client}>
      <Web3Provider>
        <GeyserContextProvider>
          <VaultContextProvider>
            <WalletContextProvider>
              <Header />
              <GeyserFirstContainer />
            </WalletContextProvider>
          </VaultContextProvider>
        </GeyserContextProvider>
      </Web3Provider>
    </ApolloProvider>
  )
}

export default App
