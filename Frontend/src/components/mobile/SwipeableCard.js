import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';
import { cn } from '../../lib/utils';
export const SwipeableCard = ({ children, onSwipeLeft, onSwipeRight, leftAction = { icon: _jsx(Archive, { className: "w-5 h-5" }), color: 'bg-primary-500', label: 'Archive' }, rightAction = { icon: _jsx(Trash2, { className: "w-5 h-5" }), color: 'bg-danger-500', label: 'Delete' }, className, }) => {
    const x = useMotionValue(0);
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
    const leftActionOpacity = useTransform(x, [0, 100], [0, 1]);
    const rightActionOpacity = useTransform(x, [-100, 0], [1, 0]);
    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.x > threshold && onSwipeRight) {
            onSwipeRight();
            x.set(0);
        }
        else if (info.offset.x < -threshold && onSwipeLeft) {
            onSwipeLeft();
            x.set(0);
        }
        else {
            x.set(0);
        }
    };
    return (_jsxs("div", { className: "relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 flex items-center justify-between px-6", children: [_jsxs(motion.div, { style: { opacity: rightActionOpacity }, className: cn('flex items-center gap-2 text-white', rightAction.color), children: [rightAction.icon, _jsx("span", { className: "font-medium", children: rightAction.label })] }), _jsxs(motion.div, { style: { opacity: leftActionOpacity }, className: cn('flex items-center gap-2 text-white', leftAction.color), children: [_jsx("span", { className: "font-medium", children: leftAction.label }), leftAction.icon] })] }), _jsx(motion.div, { drag: "x", dragConstraints: { left: -150, right: 150 }, dragElastic: 0.2, onDragEnd: handleDragEnd, style: { x, opacity }, className: cn('relative bg-white touch-pan-y', className), children: children })] }));
};
