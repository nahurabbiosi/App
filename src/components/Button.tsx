import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonProps = {
  id?: string;
  title: string;
  onPress?: () => void;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

export const Button: React.FC<ButtonProps> = ({
  id,
  title,
  onPress,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  textClassName = '',
  icon,
  type = 'button',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) onClick();
    if (onPress) onPress();
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold rounded-xl px-5 py-3 text-base transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  let variantStyles = '';
  switch (variant) {
    case 'secondary':
      variantStyles = 'bg-gray-800 text-white hover:bg-gray-700 shadow-sm';
      break;
    case 'outline':
      variantStyles = 'border-2 border-emerald-500 text-emerald-600 bg-transparent hover:bg-emerald-50';
      break;
    case 'primary':
    default:
      variantStyles = 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20';
      break;
  }

  return (
    <button
      id={id}
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando...</span>
        </span>
      ) : (
        <span className={`flex items-center justify-center gap-2 ${textClassName}`}>
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </span>
      )}
    </button>
  );
};
