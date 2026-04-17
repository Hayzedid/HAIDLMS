import React, { useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // [0.3, 0.7, 1] for 30%, 70%, 100% heights
  initialSnap?: number;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.9],
  initialSnap = 0,
}) => {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
  const dragConstraints = { top: 0, bottom: 0 };

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when bottom sheet is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.y;

    if (velocity > threshold || info.offset.y > threshold) {
      onClose();
    } else if (velocity < -threshold) {
      // Snap to next higher point
      const nextSnap = Math.min(currentSnap + 1, snapPoints.length - 1);
      setCurrentSnap(nextSnap);
    }
  };

  const height = `${snapPoints[currentSnap] * 100}%`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={dragConstraints}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ height }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[101]',
              'bg-white rounded-t-3xl shadow-2xl',
              'flex flex-col overflow-hidden'
            )}
          >
            {/* Handle Bar */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
