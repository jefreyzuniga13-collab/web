// src/Components/Common/Spinner.tsx
import '@/Styles/Common/Spinner.css'

interface SpinnerProps {
  size?: number
  text?: string
}

export default function Spinner({ size = 40, text }: SpinnerProps) {
  return (
    <div className="spinner-container">
      <div
        className="spinner"
        style={{ width: size, height: size }}
      />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  )
}
