
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  // Base: No rounded corners, thick borders, uppercase text, consistent active state
  // Added sharp active transition: translates content by 4px (matching shadow) and removes shadow to simulate pressing flat.
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-wide uppercase transition-all duration-75 ease-out focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed border-[3px] relative transform-gpu active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";
  
  const variants = {
    primary: "bg-primary-600 text-white border-black shadow-brutal hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-white hover:bg-primary-500 hover:border-white",
    secondary: "bg-zinc-800 text-gray-100 border-zinc-500 shadow-brutal hover:bg-white hover:text-black hover:border-white hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-lg",
    danger: "bg-red-600 text-white border-red-900 shadow-brutal hover:bg-red-500 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-brutal-white hover:border-white",
    ghost: "bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-zinc-800 hover:border-zinc-700 shadow-none hover:shadow-none translate-0 active:scale-95 active:translate-x-0 active:translate-y-0",
    outline: "bg-transparent border-zinc-500 text-zinc-300 hover:border-white hover:text-white hover:bg-zinc-900 hover:shadow-brutal-white hover:-translate-y-1 hover:-translate-x-1"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
