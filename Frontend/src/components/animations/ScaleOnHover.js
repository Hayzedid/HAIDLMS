import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export const ScaleOnHover = ({ children, scale = 1.05, className, }) => {
    return (_jsx(motion.div, { whileHover: { scale }, whileTap: { scale: scale - 0.02 }, transition: { type: 'spring', stiffness: 400, damping: 17 }, className: className, children: children }));
};
