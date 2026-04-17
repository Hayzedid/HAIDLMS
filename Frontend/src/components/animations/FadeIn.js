import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export const FadeIn = ({ children, delay = 0, duration = 0.5, className, direction = 'none', }) => {
    const getInitialPosition = () => {
        switch (direction) {
            case 'up':
                return { y: 20, opacity: 0 };
            case 'down':
                return { y: -20, opacity: 0 };
            case 'left':
                return { x: 20, opacity: 0 };
            case 'right':
                return { x: -20, opacity: 0 };
            default:
                return { opacity: 0 };
        }
    };
    return (_jsx(motion.div, { initial: getInitialPosition(), animate: { x: 0, y: 0, opacity: 1 }, transition: {
            duration,
            delay,
            ease: 'easeOut',
        }, className: className, children: children }));
};
