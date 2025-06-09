
import * as React from "react"
import '@/Styles/UI/input.css'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className = '', type, ...props }, ref) => {
    const finalClassName = `input ${className}`.trim();

    return (
      <input
        type={type}
        className={finalClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }