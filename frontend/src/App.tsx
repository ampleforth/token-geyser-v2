import { AppContextProvider } from 'context/AppContext'
import { Body } from 'components/Body'
import { Header } from 'components/Header'
import { VaultContextProvider } from 'context/VaultContext'
import { GeyserContextProvider } from 'context/GeyserContext'
import { Web3Provider } from 'context/Web3Context'
import { SubgraphProvider } from 'context/SubgraphContext'
import { WalletContextProvider } from 'context/WalletContext'
import { StatsContextProvider } from 'context/StatsContext'
import { DropdownsContainer } from 'components/DropdownsContainer'

import { useEffect } from 'react'

import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://65d10bb3c46af974c9c1c1bba9095149@o4505863051542528.ingest.sentry.io/4505863214465024',
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/farms.seamlessprotocol\.com/],
    }),
    new Sentry.Replay(),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.5, // Capture 100% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 0.5, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
})

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
                  <div className="flex flex-col gap-4">
                    <Header />
                    <DropdownsContainer />
                    <Body />
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
