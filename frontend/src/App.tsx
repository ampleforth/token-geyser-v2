import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from 'components/Header'
import { Home } from 'components/Home'
import { VaultContextProvider } from 'context/VaultContext'
import { GeyserContextProvider } from 'context/GeyserContext'
import { Web3Provider } from 'context/Web3Context'
import { SubgraphProvider } from 'context/SubgraphContext'
import { WalletContextProvider } from 'context/WalletContext'
import { StatsContextProvider } from 'context/StatsContext'
import { DropdownsContainer } from 'components/DropdownsContainer'

import { VaultFirstContainer } from 'components/VaultFirst/VaultFirstContainer'
import { GeyserFirstContainer } from 'components/GeyserFirst/GeyserFirstContainer'

function App() {
  return (
    <Web3Provider>
      <SubgraphProvider>
        <GeyserContextProvider>
          <VaultContextProvider>
            <WalletContextProvider>
              <StatsContextProvider>
                <Router>
                  <Header />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                      path="/geysers/:ref"
                      element={
                        <div>
                          <DropdownsContainer showVaults showGeysers />
                          <GeyserFirstContainer />
                        </div>
                      }
                    />
                    <Route
                      path="/vault"
                      element={
                        <div>
                          <DropdownsContainer showVaults />
                          <VaultFirstContainer />
                        </div>
                      }
                    />
                    <Route path="*" element={<Navigate to="/geysers/not-found" replace />} />
                  </Routes>
                </Router>
              </StatsContextProvider>
            </WalletContextProvider>
          </VaultContextProvider>
        </GeyserContextProvider>
      </SubgraphProvider>
    </Web3Provider>
  )
}

export default App
