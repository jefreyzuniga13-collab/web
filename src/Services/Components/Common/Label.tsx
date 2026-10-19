import * as React from "react"
import type { IconType } from "react-icons"
import '@/Styles/Common/Label.css'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  icon?: IconType
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', icon: Icon, children, ...props }, ref) => {
    const finalClassName = `label ${className}`.trim();

    return (
      <label
        ref={ref}
        className={finalClassName}
        {...props}
      >
        {Icon && <Icon className="label__icon" size={14} aria-hidden />}
        <span className="label__text">{children}</span>
      </label>
    )
  }
)
Label.displayName = "Label"

export { Label }
