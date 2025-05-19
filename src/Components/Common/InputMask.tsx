import InputMask from "react-input-mask";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  mask: string
  rightIcon?: React.ReactNode
  onIconClick?: () => void
}
export default function InputWithMask({
    mask,
    error,
    rightIcon,
    onIconClick,
    className = '',
    ...props
}: InputProps) {
  return (
    <div className="input-wrapper">
      <div className="input-field-wrapper">
        <InputMask
          className={`input-field ${error ? 'input-field--error' : ''} ${className}`}
          mask={mask}
          {...props}
        />
        {rightIcon && (
          <span className="input-icon" onClick={onIconClick}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  )
}