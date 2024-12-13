// react
import React from 'react'
// styles
import './PageLoader.css'

export const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000))

function PageLoader() {
  return (
    <>
      <div className="GenericProgress-Container">
        <div className="page-loader" />
      </div>
    </>
  )
}

export default PageLoader
