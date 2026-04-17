import React from 'react';
import { motion } from 'framer-motion';

interface ScaleOnHoverProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const ScaleOnHover: React.FC<ScaleOnHoverProps> = ({
  children,
  scale = 1.05,
  className,
}) => {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
