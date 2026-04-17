import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../../lib/utils';
export const Skeleton = React.forwardRef(({ className, variant = 'rectangular', width, height, ...props }, ref) => {
    const baseStyles = 'bg-gray-200 animate-pulse';
    const variants = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };
    return (_jsx("div", { ref: ref, className: cn(baseStyles, variants[variant], className), style: style, ...props }));
});
Skeleton.displayName = 'Skeleton';
export const SkeletonCard = () => {
    return (_jsxs("div", { className: "bg-white rounded-xl p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx(Skeleton, { variant: "circular", width: 48, height: 48 }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Skeleton, { variant: "text", className: "w-3/4" }), _jsx(Skeleton, { variant: "text", className: "w-1/2" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { variant: "text", className: "w-full" }), _jsx(Skeleton, { variant: "text", className: "w-5/6" }), _jsx(Skeleton, { variant: "text", className: "w-4/6" })] })] }));
};
export const SkeletonList = ({ count = 3 }) => {
    return (_jsx("div", { className: "space-y-4", children: Array.from({ length: count }).map((_, i) => (_jsx(SkeletonCard, {}, i))) }));
};
