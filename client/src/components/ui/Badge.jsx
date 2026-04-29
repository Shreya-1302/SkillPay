import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseStyle = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input',
    accent: 'border-transparent bg-accent text-accent-foreground hover:bg-accent/80',
    success: 'border-transparent bg-green-500/20 text-green-500 hover:bg-green-500/30',
    warning: 'border-transparent bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30',
  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <div className={`${baseStyle} ${selectedVariant} ${className}`}>
      {children}
    </div>
  );
};

export default Badge;
