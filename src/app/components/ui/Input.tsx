import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full h-11 px-4 bg-input-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
            error ? 'border-destructive focus:ring-destructive' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-destructive text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
