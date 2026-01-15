import React from 'react'

function BgBlack({expression = false}) {
  return (
    <div className={`fixed inset-0 bg-black opacity-50 ${expression ? "" : "hidden"}`}> </div>
  )
}

export default BgBlack
