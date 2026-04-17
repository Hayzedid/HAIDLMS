import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../../lib/utils';
export const Card = React.forwardRef(({ children, className, variant = 'default', padding = 'md', hover = false, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl transition-all-normal';
    const variants = {
        default: 'border border-gray-200',
        bordered: 'border-2 border-gray-300',
        elevated: 'shadow-lg',
        interactive: 'border border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-md',
    };
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };
    const hoverStyles = hover
        ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer'
        : '';
    return (_jsx("div", { ref: ref, className: cn(baseStyles, variants[variant], paddings[padding], hoverStyles, className), ...props, children: children }));
});
Card.displayName = 'Card';
export const CardHeader = React.forwardRef(({ children, className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('mb-4', className), ...props, children: children })));
CardHeader.displayName = 'CardHeader';
export const CardTitle = React.forwardRef(({ children, className, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn('text-xl font-bold text-gray-900', className), ...props, children: children })));
CardTitle.displayName = 'CardTitle';
export const CardDescription = React.forwardRef(({ children, className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn('text-sm text-gray-600 mt-1', className), ...props, children: children })));
CardDescription.displayName = 'CardDescription';
export const CardContent = React.forwardRef(({ children, className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn(className), ...props, children: children })));
CardContent.displayName = 'CardContent';
export const CardFooter = React.forwardRef(({ children, className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('mt-4 flex items-center gap-2', className), ...props, children: children })));
CardFooter.displayName = 'CardFooter';
