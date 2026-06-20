import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '', 
  icon: Icon,
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = "relative inline-flex items-center justify-center px-7 py-3 rounded-full text-base font-black font-sans cursor-pointer select-none border-2 transition-all active:translate-y-[3px] active:shadow-none duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none";
  
  const variants = {
    primary: "bg-brand-primary border-brand-primary text-white shadow-[0_4px_0_0_#400012] hover:shadow-[0_5px_0_0_#400012] disabled:hover:shadow-none",
    secondary: "bg-white border-brand-primary text-brand-primary shadow-[0_4px_0_0_#6D001F] hover:shadow-[0_5px_0_0_#6D001F] hover:bg-slate-50 disabled:hover:shadow-none",
    ghost: "bg-transparent border-transparent text-brand-primary hover:bg-brand-primary/5 active:translate-y-0 shadow-none border-none py-3.5"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
        {Icon && <Icon className="w-5 h-5" />}
      </span>
    </button>
  );
}
