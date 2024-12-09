import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

/// NOTE: BTOA monkey-patch. Required for coinbase wallet.
const originalBtoa = window.btoa
window.btoa = (str) => {
  try {
    return originalBtoa(str)
  } catch (e) {
    return originalBtoa(unescape(encodeURIComponent(str)))
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
