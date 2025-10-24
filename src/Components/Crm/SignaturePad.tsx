import React from 'react'
import SignatureCanvas from 'react-signature-canvas'

type Props = {
  innerRef: React.MutableRefObject<SignatureCanvas | null>
  height?: number
}

const SignaturePad: React.FC<Props> = ({ innerRef, height = 180 }) => {
  return (
    <div style={{ border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
      <SignatureCanvas
        ref={(r) => { innerRef.current = r }}
        canvasProps={{ width: '100%', height }}
        penColor="#111827"
        backgroundColor="#fff"
      />
    </div>
  )
}

export default SignaturePad