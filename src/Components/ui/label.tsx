
import * as React from "react"
import '@/Styles/UI/label.css'
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => {
  const finalClassName = `label ${className}`.trim();

  return (
    <label
      ref={ref}
      className={finalClassName}
      {...props}
    />
  )
})
Label.displayName = "Label"

export { Label }