import { ApolloProvider } from '@apollo/client';
import { Header } from './components/Header'
import { VaultFirstContainer } from './components/VaultFirstContainer'
import { VaultsProvider } from './context/VaultsContext';
import { Web3Provider } from './context/Web3Context';
import { client } from './queries/client';

function App() {
  return (
    <ApolloProvider client={client}>
      <Web3Provider>
        <VaultsProvider>
          <Header />
          <VaultFirstContainer />
        </VaultsProvider>
      </Web3Provider>
    </ApolloProvider>
  )
}

export default App;
