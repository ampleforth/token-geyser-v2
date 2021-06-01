import { ApolloProvider } from '@apollo/client';
import { Header } from './components/Header';
import { VaultFirstContainer } from './components/VaultFirstContainer';
import { VaultContextProvider } from './context/VaultContext';
import { GeyserContextProvider } from './context/GeyserContext';
import { Web3Provider } from './context/Web3Context';
import { client } from './queries/client';

function App() {
  return (
    <ApolloProvider client={client}>
      <Web3Provider>
        <VaultContextProvider>
          <GeyserContextProvider>
            <Header />
            <VaultFirstContainer />
          </GeyserContextProvider>
        </VaultContextProvider>
      </Web3Provider>
    </ApolloProvider>
  );
}

export default App;
