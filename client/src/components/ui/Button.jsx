import React from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary:   'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary',
  danger:    'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive',
  ghost:     'bg-transparent text-foreground hover:bg-secondary/60 focus-visible:ring-secondary',
  outline:   'border border-border bg-transparent text-foreground hover:bg-secondary/50 focus-visible:ring-secondary',
};

const sizeClasses = {
  sm:  'px-3 py-1.5 text-xs rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-7 py-3 text-base rounded-xl',
};

/**
 * Reusable Button component.
 *
 * @param {string}   label     - Button text (also used as aria-label)
 * @param {function} onClick   - Click handler
 * @param {string}   variant   - 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * @param {string}   size      - 'sm' | 'md' | 'lg'
 * @param {boolean}  isLoading - Shows spinner and disables click when true
 * @param {boolean}  disabled  - Explicitly disables the button
 * @param {string}   type      - HTML button type (default 'button')
 * @param {string}   className - Extra Tailwind classes
 * @param {node}     icon      - Optional Lucide icon element rendered before label
 * @param {string}   id        - HTML id attribute
 */
const Button = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  icon = null,
  id,
  children,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}

      {/* Support both label prop and children */}
      {children ?? label}
    </button>
  );
};

export default Button;
