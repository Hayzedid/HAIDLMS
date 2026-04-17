import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
export const BottomSheet = ({ isOpen, onClose, title, children, snapPoints = [0.9], initialSnap = 0, }) => {
    const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
    const dragConstraints = { top: 0, bottom: 0 };
    useEffect(() => {
        if (isOpen) {
            // Prevent body scroll when bottom sheet is open
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    const handleDragEnd = (event, info) => {
        const threshold = 50;
        const velocity = info.velocity.y;
        if (velocity > threshold || info.offset.y > threshold) {
            onClose();
        }
        else if (velocity < -threshold) {
            // Snap to next higher point
            const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
            setCurrentSnap(nextSnap);
        }
    };
    const height = `${snapPoints[currentSnap] * 100}%`;
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" }), _jsxs(motion.div, { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, drag: "y", dragConstraints: dragConstraints, dragElastic: 0.2, onDragEnd: handleDragEnd, transition: { type: 'spring', damping: 30, stiffness: 300 }, style: { height }, className: cn('fixed bottom-0 left-0 right-0 z-[101]', 'bg-white rounded-t-3xl shadow-2xl', 'flex flex-col overflow-hidden'), children: [_jsx("div", { className: "flex justify-center py-3 cursor-grab active:cursor-grabbing", children: _jsx("div", { className: "w-12 h-1.5 bg-gray-300 rounded-full" }) }), title && (_jsxs("div", { className: "flex items-center justify-between px-6 pb-4 border-b border-gray-200", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: title }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] })), _jsx("div", { className: "flex-1 overflow-y-auto px-6 py-6", children: children })] })] })) }));
};
