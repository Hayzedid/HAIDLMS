import React from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2, Archive } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: React.ReactNode;
    color?: string;
    label?: string;
  };
  rightAction?: {
    icon?: React.ReactNode;
    color?: string;
    label?: string;
  };
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: <Archive className="w-5 h-5" />, color: 'bg-primary-500', label: 'Archive' },
  rightAction = { icon: <Trash2 className="w-5 h-5" />, color: 'bg-danger-500', label: 'Delete' },
  className,
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);
  const leftActionOpacity = useTransform(x, [0, 100], [0, 1]);
  const rightActionOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
      x.set(0);
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
      x.set(0);
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {/* Right Action (visible on swipe left) */}
        <motion.div
          style={{ opacity: rightActionOpacity }}
          className={cn('flex items-center gap-2 text-white', rightAction.color)}
        >
          {rightAction.icon}
          <span className="font-medium">{rightAction.label}</span>
        </motion.div>

        {/* Left Action (visible on swipe right) */}
        <motion.div
          style={{ opacity: leftActionOpacity }}
          className={cn('flex items-center gap-2 text-white', leftAction.color)}
        >
          <span className="font-medium">{leftAction.label}</span>
          {leftAction.icon}
        </motion.div>
      </div>

      {/* Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className={cn('relative bg-white touch-pan-y', className)}
      >
        {children}
      </motion.div>
    </div>
  );
};
