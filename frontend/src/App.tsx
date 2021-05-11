import { ApolloProvider } from '@apollo/client';
import './App.css';
import HeaderContainer from './containers/HeaderContainer';
import SelectVaultContainer from './containers/SelectVaultContainer';
import { Web3Provider } from './context/Web3Context';
import { client } from './queries/client';

function App() {
  return (
    <ApolloProvider client={client}>
      <Web3Provider>
        <HeaderContainer />
        <SelectVaultContainer />
      </Web3Provider>
    </ApolloProvider>
  );
}

export default App;
