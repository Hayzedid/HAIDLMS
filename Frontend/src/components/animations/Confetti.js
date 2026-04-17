import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export const Confetti = ({ show, onComplete, count = 50, }) => {
    const [particles, setParticles] = useState([]);
    const colors = [
        '#6366f1', // primary
        '#22c55e', // success
        '#f59e0b', // warning
        '#a855f7', // accent
        '#ef4444', // danger
    ];
    useEffect(() => {
        if (show) {
            const newParticles = [];
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: Math.random() * 10 + 5,
                    rotation: Math.random() * 360,
                    velocityX: (Math.random() - 0.5) * 10,
                    velocityY: Math.random() * 5 + 5,
                });
            }
            setParticles(newParticles);
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, count, onComplete]);
    return (_jsx(AnimatePresence, { children: show && (_jsx("div", { className: "fixed inset-0 pointer-events-none z-[9999] overflow-hidden", children: particles.map((particle) => (_jsx(motion.div, { initial: {
                    x: particle.x,
                    y: particle.y,
                    rotate: particle.rotation,
                    opacity: 1,
                }, animate: {
                    y: window.innerHeight + 20,
                    x: particle.x + particle.velocityX * 50,
                    rotate: particle.rotation + 360,
                    opacity: 0,
                }, transition: {
                    duration: 3,
                    ease: 'easeOut',
                }, style: {
                    position: 'absolute',
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    borderRadius: '50%',
                } }, particle.id))) })) }));
};
