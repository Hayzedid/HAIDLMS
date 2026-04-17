import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { motion } from 'framer-motion';
export const StaggerChildren = ({ children, staggerDelay = 0.1, className, }) => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
            },
        },
    };
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };
    return (_jsx(motion.div, { variants: container, initial: "hidden", animate: "show", className: className, children: React.Children.map(children, (child) => (_jsx(motion.div, { variants: item, children: child }))) }));
};
