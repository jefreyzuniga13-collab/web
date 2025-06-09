
import * as React from "react"
import '@/Styles/UI/button.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const baseClass = 'button';
    const variantClass = `button--${variant}`;
    const sizeClass = `button--${size}`;
    const finalClassName = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

    return (
      <button
        className={finalClassName}
        ref={ref}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button }