import React from 'react';
import './index.css';
import { Spinner } from 'react-bootstrap';

export default function Button({
    type = 'button',
    label,
    onClick,
    className = '',
    variant = 'solid', // 'solid' | 'outline'
    size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
    iconLeft,
    iconRight,
    isLoading = false,
    disabled = false,
    fullWidth = false,
    radius, // 1 | 2 | 3 | 4 | 5
    ...rest
}) {

    return (
        <button
            type={type}
            className={`
        btn-custom 
        btn-${variant}
        btn-${size} 
        ${fullWidth ? 'w-100' : ''} 
        flex flex-row align-items-center justify-content-center gap-2
        ${className}
        rounded-${radius}
      `}
            onClick={onClick}
            disabled={disabled || isLoading}
            {...rest}
        >
            {isLoading ? (
                <Spinner size="sm" animation="border" />
            ) : (
                <>
                    {iconLeft && <span>{iconLeft}</span>}
                    <span>{label}</span>
                    {iconRight && <span>{iconRight}</span>}
                </>
            )}
        </button>
    );
}
