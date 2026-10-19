import React from 'react'
import { ThreeDot } from 'react-loading-indicators'

export const CustomLoader = () => {
  return (
    <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
  )
}
export default CustomLoader;
